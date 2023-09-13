import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { range } from './utils.js';

import vertex from "./shader/vertex.glsl"
import fragment from "./shader/fragment.glsl"

import dat from "dat.gui";

export default class Sketch {
    constructor(opstions) {
        this.scene = new THREE.Scene();

        this.container = opstions.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x55cde6, 1);

        this.container.appendChild(this.renderer.domElement);

        this.mainRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: true,
            stencilBuffer: false
        });

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.001,
            1000.0
        );
        this.camera.position.set(0.0, 0.0, 8.0);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.isPlaying = true;

        this.addObjects();
        this.addLight();
        this.resize();
        this.render();
        this.setupResize();
        this.settings();
    }

    settings() {
        let that = this;
        this.settings = {
            lightX: -1.0,
            lightY: 1.0,
            lightZ: 1.0,
            '拡散値': 0.2,
            "反射値": 15.0,
            "フレネル効果": 1.5,
            "分離の強さ": 0.5,
            "屈折効果": 0.25,
            "ガンマ値": 0.45,
        };
        this.gui = new dat.GUI();
        const LIGHTFolder = this.gui.addFolder('ライトの設定');

        LIGHTFolder.add(this.settings, "lightX", -6.0, 6.0, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uLight.value.x = val;
        });
        LIGHTFolder.add(this.settings, "lightY", -6.0, 6.0, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uLight.value.y = val;
        });
        LIGHTFolder.add(this.settings, "lightZ", -6.0, 6.0, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uLight.value.z = val;
        });
        LIGHTFolder.add(this.settings, "拡散値", 0.0, 1.0, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uDiffuseness.value = val;
        });
        LIGHTFolder.add(this.settings, "反射値", 10.0, 80.0, 1.0).onChange((val) => {
            this.mesh.material.uniforms.uShininess.value = val;
        });
        LIGHTFolder.add(this.settings, "フレネル効果", 1.0, 10.0, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uFresnelPower.value = val;
        });
        this.gui.add(this.settings, "分離の強さ", 0.0, 1.5, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uChromaticAberration.value = val;
        });
        this.gui.add(this.settings, "屈折効果", 0.0, 1.0, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uRefractPower.value = val;
        });
        this.gui.add(this.settings, "ガンマ値", 0.0, 2.2, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uGamma.value = val;
        });
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;

        this.camera.updateProjectionMatrix();
    }

    addObjects() {
        let that = this;
        this.material = new THREE.RawShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            uniforms: {
                uTexture: { value: null },
                uRefractPower: { value: 0.2 },
                uChromaticAberration: { value: 1.0 },
                uShininess: { value: 40.0 },
                uDiffuseness: { value: 0.2 },
                uFresnelPower: { value: 1.5 },
                uGamma: { value: 0.45 },
                uLight: { value: new THREE.Vector3(-1.0, 1.0, 1.0) },
                winResolution: {
                    value: new THREE.Vector2(
                        window.innerWidth,
                        window.innerHeight
                    ).multiplyScalar(Math.min(window.devicePixelRatio, 2)),
                },
            },
            // wireframe: true,
            // transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment,
        });

        this.geometry = new THREE.IcosahedronGeometry(2.84, 20.0);

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        this.group = new THREE.Group();
        this.geo = new THREE.IcosahedronGeometry(0.5, 8.0);
        this.mat = new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

        const colums = range(-7.5, 7.5, 2.5);
        const rows = range(-7.5, 7.5, 2.5);

        colums.map((col) => {
            rows.map((row) => {
                const mesh = new THREE.Mesh(this.geo, this.mat);
                mesh.position.set(col, row, -4);
                this.group.add(mesh);
            });
        });

        this.scene.add(this.group);
    }

    addLight() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambient);
    }

    stop() {
        this.isPlaying = false;
    }

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.render();
        }
    }

    render() {
        if (!this.isPlaying) return;

        this.group.visible = true;
        this.mesh.visible = false;

        this.renderer.setRenderTarget(this.mainRenderTarget);
        this.renderer.render(this.scene, this.camera);

        this.mesh.material.uniforms.uTexture.value = this.mainRenderTarget.texture;

        this.renderer.setRenderTarget(null);
        this.group.visible = false;
        this.mesh.visible = true;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }
}

new Sketch({
    dom: document.getElementById("container")
});