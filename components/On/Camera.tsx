import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GameState } from '../../types';
import { audio } from '../../services/audio';

interface CameraProps {
    gameState: GameState;
}

export default function Camera({ gameState }: CameraProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const zombiesRef = useRef<THREE.Group[]>([]);
    const frameIdRef = useRef<number>(0);

    // Use a ref to access the latest game state in the animation loop without restarting it
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // References to dynamic objects for updates
    const fogRef = useRef<THREE.FogExp2 | null>(null);
    const rainSystemRef = useRef<THREE.Points | null>(null);
    const sporeSystemRef = useRef<THREE.Points | null>(null);
    const spotLightRef = useRef<THREE.SpotLight | null>(null);
    const dangerLightRef = useRef<THREE.PointLight | null>(null);
    const lightningLightRef = useRef<THREE.PointLight | null>(null);
    const sirenLightRef = useRef<THREE.SpotLight | null>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

    // Initialize Scene
    useEffect(() => {
        if (!containerRef.current) return;

        // Initial dimensions
        let width = containerRef.current.clientWidth;
        let height = containerRef.current.clientHeight;

        // Scene & Fog
        const scene = new THREE.Scene();
        const fog = new THREE.FogExp2(0x020302, 0.04);
        scene.fog = fog;
        fogRef.current = fog;
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 2.5, 4);
        camera.lookAt(0, 1, -20);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        // Clear any existing canvas
        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Ground
        const planeGeo = new THREE.PlaneGeometry(300, 300, 50, 50);
        const pos = planeGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            pos.setZ(i, Math.sin(x / 5) * 0.8 + Math.cos(y / 5) * 0.8 + Math.random() * 0.5);
        }
        planeGeo.computeVertexNormals();
        const plane = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ color: 0x111211, roughness: 0.95, metalness: 0.05, flatShading: true }));
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x223322, 0.05);
        scene.add(ambientLight);
        ambientLightRef.current = ambientLight;

        const dirLight = new THREE.DirectionalLight(0x334444, 0.0);
        dirLight.position.set(10, 50, -20);
        scene.add(dirLight);

        const spotLight = new THREE.SpotLight(0xcceeff, 4.0);
        spotLight.position.set(0, 8, 2);
        spotLight.angle = Math.PI / 5;
        spotLight.penumbra = 0.8;
        spotLight.decay = 1.5;
        spotLight.distance = 80;
        spotLight.target.position.set(0, 0, -20);
        scene.add(spotLight);
        scene.add(spotLight.target);
        spotLightRef.current = spotLight;

        const dangerLight = new THREE.PointLight(0xff0000, 0, 50);
        dangerLight.position.set(0, 5, -5);
        scene.add(dangerLight);
        dangerLightRef.current = dangerLight;

        const sirenLight = new THREE.SpotLight(0xffaa00, 0);
        sirenLight.position.set(0, 5, 0);
        sirenLight.angle = Math.PI / 2;
        sirenLight.penumbra = 0.2;
        sirenLight.distance = 100;
        scene.add(sirenLight);
        scene.add(sirenLight.target);
        sirenLightRef.current = sirenLight;

        const lightningLight = new THREE.PointLight(0xddffff, 0, 400);
        lightningLight.position.set(0, 80, -60);
        scene.add(lightningLight);
        lightningLightRef.current = lightningLight;

        // Ruins
        const ruinMat = new THREE.MeshLambertMaterial({ color: 0x0a0c0a });
        for (let i = 0; i < 60; i++) {
            const w = Math.random() * 5 + 1;
            const h = Math.random() * 10 + 2;
            const d = Math.random() * 5 + 1;
            const ruin = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ruinMat);
            ruin.position.set((Math.random() - 0.5) * 120, h / 2 - 1, -10 - Math.random() * 120);
            ruin.rotation.y = Math.random() * Math.PI;
            ruin.rotation.z = (Math.random() - 0.5) * 0.2;
            scene.add(ruin);
        }

        // Rain
        const rainGeo = new THREE.BufferGeometry();
        const rainPos = [];
        for (let i = 0; i < 10000; i++) rainPos.push((Math.random() - 0.5) * 120, Math.random() * 50, -5 - Math.random() * 100);
        rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainPos, 3));
        const rainSystem = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x77aa77, size: 0.1, transparent: true, opacity: 0.5 }));
        scene.add(rainSystem);
        rainSystemRef.current = rainSystem;

        // Spores
        const sporeGeo = new THREE.BufferGeometry();
        const sporePos = [];
        for (let i = 0; i < 1500; i++) sporePos.push((Math.random() - 0.5) * 60, Math.random() * 15, -Math.random() * 60);
        sporeGeo.setAttribute('position', new THREE.Float32BufferAttribute(sporePos, 3));
        const sporeSystem = new THREE.Points(sporeGeo, new THREE.PointsMaterial({ color: 0x55ff55, size: 0.15, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending }));
        scene.add(sporeSystem);
        sporeSystemRef.current = sporeSystem;

        // Zombies
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0d120d });
        const skinMat = new THREE.MeshLambertMaterial({ color: 0x1a261a });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.2, 1.0, 5);
        const headGeo = new THREE.BoxGeometry(0.35, 0.4, 0.35);
        const armGeo = new THREE.BoxGeometry(0.1, 0.9, 0.1);
        const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);

        const zombies: THREE.Group[] = [];
        for (let i = 0; i < 45; i++) {
            const group = new THREE.Group();
            const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = 0.8; group.add(body);
            const headGroup = new THREE.Group(); const head = new THREE.Mesh(headGeo, skinMat); headGroup.add(head);
            const lEye = new THREE.Mesh(eyeGeo, eyeMat); lEye.position.set(-0.1, 0.05, 0.18); headGroup.add(lEye);
            const rEye = new THREE.Mesh(eyeGeo, eyeMat); rEye.position.set(0.1, 0.05, 0.18); headGroup.add(rEye);
            headGroup.position.y = 1.45; group.add(headGroup);
            const lArm = new THREE.Mesh(armGeo, skinMat); lArm.position.set(-0.4, 1.0, 0.2); lArm.rotation.x = -0.5; group.add(lArm);
            const rArm = new THREE.Mesh(armGeo, skinMat); rArm.position.set(0.4, 1.0, 0.2); rArm.rotation.x = -0.6; group.add(rArm);

            group.position.set((Math.random() - 0.5) * 100, 0, -20 - Math.random() * 90);
            group.userData = { baseSpeed: 0.015 + Math.random() * 0.04, targetX: (Math.random() - 0.5) * 60, targetZ: -10 - Math.random() * 60, offset: Math.random() * 100, eyes: [lEye, rEye] };
            scene.add(group);
            zombies.push(group);
        }
        zombiesRef.current = zombies;

        // Handle Resize with ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === containerRef.current && rendererRef.current && cameraRef.current) {
                    const { width, height } = entry.contentRect;
                    if (width === 0 || height === 0) return;

                    cameraRef.current.aspect = width / height;
                    cameraRef.current.updateProjectionMatrix();
                    rendererRef.current.setSize(width, height);
                }
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Animation Loop
        const clock = new THREE.Clock();
        let droneZ = 0;
        let droneX = 0;
        let lightningTimer = 0;

        const animate = () => {
            if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

            const delta = Math.min(clock.getDelta(), 0.1);
            const time = Date.now() * 0.001;
            const currentState = gameStateRef.current;

            // Weather & Zone Updates
            let targetFogColor = new THREE.Color(0x020302);
            let targetFogDensity = 0.04;
            let targetAmbientIntensity = 0.05;
            const w = currentState.weather;
            const zone = currentState.currentZone;

            // Base Zone Styles
            if (zone === 'CORE') {
                targetFogColor.setHex(0x020502);
                targetFogDensity = 0.03;
                targetAmbientIntensity = 0.1;
            } else if (zone === 'ENGINEERING') {
                targetFogColor.setHex(0x0a0a05);
                targetFogDensity = 0.05;
            } else if (zone === 'REC_ROOM') {
                targetFogColor.setHex(0x05050a);
                targetFogDensity = 0.06;
            }

            // Weather Overrides
            if (w === 'TOXIC_STORM') { targetFogColor.lerp(new THREE.Color(0x0a1a0a), 0.5); targetFogDensity += 0.03; rainSystemRef.current!.material.color.setHex(0x33ff33); }
            else if (w === 'RAD_SURGE') { targetFogColor.lerp(new THREE.Color(0x1a0a0a), 0.5); targetFogDensity += 0.02; rainSystemRef.current!.material.color.setHex(0xffaa55); }
            else if (w === 'EMP_PULSE') { targetFogColor.setHex(0x000000); targetFogDensity = 0.08; targetAmbientIntensity = 0.01; }

            fogRef.current!.color.lerp(targetFogColor, 0.05);
            fogRef.current!.density += (targetFogDensity - fogRef.current!.density) * 0.05;
            rendererRef.current.setClearColor(fogRef.current!.color);

            if (ambientLightRef.current) {
                ambientLightRef.current.intensity += (targetAmbientIntensity - ambientLightRef.current.intensity) * 0.05;
            }

            // Rain Animation
            let rainSpeed = w === 'TOXIC_STORM' ? 0.3 : 0.15;
            const rainGeo = rainSystemRef.current!.geometry;
            const rPos = rainGeo.attributes.position.array as Float32Array;
            for (let i = 0; i < rPos.length; i += 3) {
                rPos[i] -= rainSpeed * 0.5;
                rPos[i + 1] -= rainSpeed * 5;
                if (rPos[i + 1] < 0) {
                    rPos[i] = (Math.random() - 0.5) * 120 + cameraRef.current.position.x;
                    rPos[i + 1] = 50;
                }
            }
            rainGeo.attributes.position.needsUpdate = true;
            rainSystemRef.current!.rotation.z = rainSpeed;

            // Spore Animation
            let sporeSpeed = w === 'RAD_SURGE' ? 0.03 : 0.01;
            const sporeGeo = sporeSystemRef.current!.geometry;
            const sPos = sporeGeo.attributes.position.array as Float32Array;
            for (let i = 0; i < sPos.length; i += 3) {
                sPos[i] += Math.sin(time * 0.5 + i) * sporeSpeed;
                sPos[i + 1] += Math.cos(time * 0.3 + i) * sporeSpeed;
            }
            sporeGeo.attributes.position.needsUpdate = true;

            // Camera Logic
            const isExternal = currentState.viewMode === 'DRONE' || currentState.currentZone !== 'CORE';
            let baseShake = isExternal ? 0.015 : 0.005;
            if (currentState.player.sanity < 30) baseShake = 0.15;
            else if (currentState.zoneThreat > 75) baseShake = 0.08;

            if (isExternal) {
                if (currentState.viewMode === 'DRONE') {
                    droneZ -= delta * 12;
                    if (droneZ < -100) droneZ = 0;
                } else {
                    droneZ = -5 + Math.sin(time * 0.1) * 3;
                }
                droneX = Math.sin(time * 0.4) * 4;
                cameraRef.current.position.set(droneX, 3.5 + Math.cos(time * 1.5) * 0.4, droneZ);
                cameraRef.current.lookAt(droneX, 1, droneZ - 20);
                rainSystemRef.current!.position.set(droneX, 0, droneZ);
                spotLightRef.current!.position.set(droneX, 6, droneZ + 2);
                spotLightRef.current!.target.position.set(droneX + Math.sin(time) * 3, 0, droneZ - 15);
            } else {
                cameraRef.current.position.set(0, 2.5, 4);
                cameraRef.current.lookAt(Math.sin(time * 0.1) * 2, 1, -20);
                rainSystemRef.current!.position.set(0, 0, 0);
                spotLightRef.current!.position.set(0, 8, 2);
                spotLightRef.current!.target.position.set(Math.sin(time * 0.15) * 10, 0, -25);
            }

            cameraRef.current.position.x += (Math.sin(time * 45) + Math.cos(time * 35)) * baseShake;
            cameraRef.current.position.y += (Math.cos(time * 40)) * baseShake;
            cameraRef.current.rotation.z += (Math.sin(time * 20)) * baseShake * 0.5;

            // Zombies
            zombiesRef.current.forEach(z => {
                let isAggressive = currentState.zoneThreat > 65;
                if (w === 'RAD_SURGE') isAggressive = true;

                const speed = isAggressive ? z.userData.baseSpeed * 4.5 : z.userData.baseSpeed;
                z.userData.eyes.forEach((eye: THREE.Mesh) => {
                    (eye.material as THREE.Material).opacity = isAggressive ? 1 : 0.1 + Math.sin(time * 4 + z.userData.offset) * 0.2;
                });

                if (isAggressive) {
                    z.userData.targetX = cameraRef.current!.position.x;
                    z.userData.targetZ = cameraRef.current!.position.z;
                }
                const dx = z.userData.targetX - z.position.x;
                const dz = z.userData.targetZ - z.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist > 2.0) {
                    z.position.x += (dx / dist) * speed;
                    z.position.z += (dz / dist) * speed;
                    z.rotation.y += (Math.atan2(dx, dz) - z.rotation.y) * 0.1;
                } else if (!isAggressive) {
                    z.userData.targetX = (Math.random() - 0.5) * 100;
                    z.userData.targetZ = cameraRef.current!.position.z - 10 - Math.random() * 70;
                }
                z.position.y = Math.abs(Math.sin(time * (isAggressive ? 15 : 6) + z.userData.offset)) * 0.2;
                z.rotation.x = Math.max(0, z.rotation.x - 0.05);
                z.rotation.z = Math.sin(time * 2.5 + z.userData.offset) * 0.15;
                z.children[2].rotation.x = -0.5 + Math.sin(time * 12) * (isAggressive ? 1.2 : 0.3);
                z.children[3].rotation.x = -0.6 + Math.cos(time * 12) * (isAggressive ? 1.2 : 0.3);
            });

            // Lights
            dangerLightRef.current!.intensity = currentState.zoneThreat > 80 ? Math.abs(Math.sin(time * 10)) * 10 : 0;

            lightningTimer -= delta;
            if (lightningTimer <= 0 && w !== 'EMP_PULSE' && Math.random() < 0.02) {
                lightningLightRef.current!.intensity = 50 + Math.random() * 100;
                lightningTimer = 1 + Math.random() * 5;
                if (w === 'TOXIC_STORM') lightningLightRef.current!.color.setHex(0xaaffaa);
                else lightningLightRef.current!.color.setHex(0xddffff);
            } else {
                lightningLightRef.current!.intensity *= 0.7;
            }

            // Day/Night Cycle & Spotlights
            const hr = currentState.time.hour % 24;
            let dayRatio = 0;
            if (hr >= 6 && hr <= 18) dayRatio = Math.sin(((hr - 6) / 12) * Math.PI);
            if (w === 'EMP_PULSE' || w === 'TOXIC_STORM') dayRatio *= 0.2;

            const isDark = dayRatio < 0.2 || w === 'EMP_PULSE';
            const shouldBeOn = (isDark && currentState.bunker.power > 0 && w !== 'EMP_PULSE') || currentState.currentZone === 'CORE';

            // Flickering logic based on power and sanity
            let flick = 1.0;
            if (currentState.bunker.power < 20 || currentState.zoneThreat > 80 || currentState.player.sanity < 30) {
                const flickerThreshold = currentState.bunker.power < 5 ? 0.35 : 0.85;
                if (Math.random() > flickerThreshold) {
                    flick = 0.1 + Math.random() * 0.4;
                    // Extreme flickering during power failure
                    if (currentState.bunker.power <= 0) flick = 0;
                }
            }

            if (spotLightRef.current) {
                spotLightRef.current.intensity = shouldBeOn ? (4.5 + Math.sin(time * 2) * 0.5) * flick : 0;
            }

            if (ambientLightRef.current) {
                const baseAmbient = isDark ? 0.03 : 0.18 * dayRatio;
                ambientLightRef.current.intensity = baseAmbient * flick;
            }

            // Low Sanity visual hallucination (Camera shake intensification)
            if (currentState.player.sanity < 30) {
                const intensity = (30 - currentState.player.sanity) / 30;
                cameraRef.current.position.x += (Math.random() - 0.5) * 0.2 * intensity;
                cameraRef.current.position.y += (Math.random() - 0.5) * 0.2 * intensity;

                if (Math.random() > 0.99) {
                    audio.playNoise(0.4 * intensity, 'low');
                }
            }

            // Post Processing (CSS Filters simulated via style prop on container in parent, but here we handle render loop)
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            frameIdRef.current = requestAnimationFrame(animate);
        };

        frameIdRef.current = requestAnimationFrame(animate);

        return () => {
            resizeObserver.disconnect();
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                containerRef.current?.removeChild(rendererRef.current.domElement);
            }
        };
    }, []); // No dependencies, runs once

    return <div ref={containerRef} className="w-full h-full" />;
}
