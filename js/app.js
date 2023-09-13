import * as THREE from 'three';

import vertex from "./shader/vertex.glsl"
import fragment from "./shader/fragment.glsl"

import gsap from 'gsap';
import dat from "dat.gui";

import text1 from '/image/fv-text-1.png'
import text2 from '/image/fv-text-2.png'

export default class Sketch {
    constructor(opstions) {
        this.scene = new THREE.Scene();

        this.container = opstions.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(new THREE.Color(0x55 / 255, 0xcd / 255, 0xe6 / 255), 1);

        this.container.appendChild(this.renderer.domElement);

        this.renderer.outputColorSpace = THREE.NoColorSpace;
        this.mainRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            format: THREE.RGBAFormat,
            colorSpace: THREE.NoColorSpace,
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

        const FOV_RAD = 60 * 0.5 * (Math.PI / 180);
        const dist = (this.height * 0.5) / Math.tan(FOV_RAD);
        this.camera.position.z = dist;

        this.isPlaying = true;

        this.loader = new THREE.TextureLoader();

        this.addObjects();
        this.addLight();
        this.resize();
        this.render();
        this.setupResize();
        // this.settings();

        window.addEventListener("mousewheel", (e) => {
            if(this.tween){
                return;
            }

            const tl = gsap.timeline();
            if(e.deltaY > 0){
                this.tween = tl.to(this.mesh.scale, {
                    x: this.camera.position.z * 0.02,
                    y: this.camera.position.z * 0.02,
                    z: this.camera.position.z * 0.02,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.mesh.material.uniforms.uLightOpacity, {
                    value: 0.5,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.mesh.material.uniforms.uFresnelOpacity, {
                    value: 1.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.mesh.material.uniforms.uGamma, {
                    value: 1.8,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.text.rotation, {
                    y: 360 * (Math.PI/ 180),
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.text1.material, {
                    opacity: 0.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.text2.material, {
                    opacity: 0.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).add(() => {
                    this.tween = false;
                });
            }else{
                this.tween = tl.to(this.mesh.scale, {
                    x: this.camera.position.z,
                    y: this.camera.position.z,
                    z: this.camera.position.z,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.mesh.material.uniforms.uLightOpacity, {
                    value: 0.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.mesh.material.uniforms.uFresnelOpacity, {
                    value: 0.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.mesh.material.uniforms.uGamma, {
                    value: 1.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.text.rotation, {
                    y: 0.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.text1.material, {
                    opacity: 1.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).to(this.text2.material, {
                    opacity: 1.0,
                    delay: -1,
                    ease: "expo.inOut",
                    duration: 1
                }).add(() => {
                    this.tween = false;
                });
            }
        });
    }

    settings() {
        let that = this;
        this.settings = {
            lightX: -1.0,
            lightY: 1.0,
            lightZ: 1.0,
            '拡散値': 0.2,
            "反射値": 15.0,
            "フレネル効果": 4.0,
            "分離の強さ": 0.5,
            "屈折効果": 0.25,
            "ガンマ値": 1.0,
            "ライト透明度": 0.5,
            "フレネル効果透明度": 1.0,
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
        this.gui.add(this.settings, "ガンマ値", 0.5, 2.2, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uGamma.value = val;
        });
        this.gui.add(this.settings, "ライト透明度", 0.0, 0.5, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uLightOpacity.value = val;
        });
        this.gui.add(this.settings, "フレネル効果透明度", 0.0, 1.0, 0.01).onChange((val) => {
            this.mesh.material.uniforms.uFresnelOpacity.value = val;
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

        const FOV_RAD = 60 * 0.5 * (Math.PI / 180);
        const dist = (this.height * 0.5) / Math.tan(FOV_RAD);
        this.camera.position.z = dist;

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
                uFresnelPower: { value: 4.0 },
                uChromaticAberration: { value: 1.0 },
                uShininess: { value: 40.0 },
                uDiffuseness: { value: 0.2 },
                uLight: { value: new THREE.Vector3(-1.0, 1.0, 1.0) },
                uLightOpacity: { value: 0.0 },
                uFresnelOpacity: { value: 0.0 },
                uGamma: { value: 1.0 },
                winResolution: {
                    value: new THREE.Vector2(
                        window.innerWidth,
                        window.innerHeight
                    ).multiplyScalar(Math.min(window.devicePixelRatio, 2)),
                },
            },
            vertexShader: vertex,
            fragmentShader: fragment,
        });

        this.geometry = new THREE.IcosahedronGeometry(1.0, 20.0);

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.scale.set(this.camera.position.z, this.camera.position.z, this.camera.position.z);
        this.scene.add(this.mesh);

        this.text = new THREE.Group();

        this.geo = new THREE.PlaneGeometry(200.0, 200.0);
        this.mat = new THREE.MeshBasicMaterial({map: this.loader.load(text1), transparent: true});
        this.text1 = new THREE.Mesh(this.geo, this.mat);
        this.text1.position.x = -100;
        this.text.add(this.text1);

        this.geo = new THREE.PlaneGeometry(200.0, 200.0);
        this.mat = new THREE.MeshBasicMaterial({map: this.loader.load(text2), transparent: true});
        this.text2 = new THREE.Mesh(this.geo, this.mat);
        this.text2.position.x = 100;
        this.text.add(this.text2);

        this.scene.add(this.text);
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

        this.text.visible = true;
        this.mesh.visible = false;

        this.renderer.setRenderTarget(this.mainRenderTarget);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);

        this.mesh.material.uniforms.uTexture.value = this.mainRenderTarget.texture;

        this.renderer.setRenderTarget(null);
        this.text.visible = false;
        this.mesh.visible = true;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }
}

new Sketch({
    dom: document.getElementById("container")
});