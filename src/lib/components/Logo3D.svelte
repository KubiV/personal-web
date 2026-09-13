<script>
	import { onMount, onDestroy } from 'svelte';

	/**
	 * Cesta k 3D modelu (standardně .glb nebo .obj)
	 * Pokud soubor neexistuje, automaticky se zkusí druhá přípona (.obj / .glb).
	 */
	export let src = '/models/logo.glb';

	/**
	 * Cesta k záložnímu obrázku při načítání nebo selhání WebGL
	 */
	export let fallbackSrc = '/logos/logo-3d.png';

	/**
	 * Alternativní text pro přístupnost
	 */
	export let alt = 'KubiV 3D Logo';

	/**
	 * Velikost kontejneru v pixelech (šířka i výška)
	 */
	export let size = 110;

	/**
	 * Výchozí natočení 3D objektu ve stupních { x, y, z }.
	 * Výchozí { x: 0, y: 0, z: 0 } odpovídá Fusion 360 Home pohledu zespodu na pravou stranu modelu!
	 */
	export let initialRotation = { x: 0, y: 0, z: 0 };

	/**
	 * Výchozí měřítko objektu (1 = optimální normalizovaná velikost)
	 */
	export let scale = 1;

	/**
	 * Zda se má po opuštění myší model plynule vrátit do výchozího úhlu
	 */
	export let autoReset = true;

	/**
	 * Zda zapnout výpis aktuálních úhlů do konzole při každém otočení
	 */
	export let debug = false;

	let containerEl;
	let canvasEl;
	let isModelLoaded = false;
	let isDragging = false;
	let isHovered = false;

	let renderer;
	let animId;

	// Rotace v radiánech (přepočet bez nutnosti načítat Three na serveru)
	const DEG2RAD = Math.PI / 180;
	const RAD2DEG = 180 / Math.PI;

	let initRotRad = { x: 0, y: 0, z: 0 };
	let currentRot = { x: 0, y: 0, z: 0 };
	let targetRot = { x: 0, y: 0, z: 0 };
	let hoverTilt = { x: 0, y: 0 };

	let lastPointer = { x: 0, y: 0 };
	let velocity = { x: 0, y: 0 };

	$: {
		initRotRad = {
			x: ((initialRotation && initialRotation.x) || 0) * DEG2RAD,
			y: ((initialRotation && initialRotation.y) || 0) * DEG2RAD,
			z: ((initialRotation && initialRotation.z) || 0) * DEG2RAD
		};
		if (!isDragging && !isHovered) {
			targetRot.x = initRotRad.x;
			targetRot.y = initRotRad.y;
			targetRot.z = initRotRad.z;
		}
	}

	onMount(async () => {
		const isDebugMode = debug || (typeof window !== 'undefined' && window.location.search.includes('debug3d=1'));

		// Dynamický import Three.js pouze v prohlížeči (zaručuje 0 vliv na SSR a rychlé LCP)
		const [THREE, { GLTFLoader }, { OBJLoader }, { MTLLoader }] = await Promise.all([
			import('three'),
			import('three/examples/jsm/loaders/GLTFLoader.js'),
			import('three/examples/jsm/loaders/OBJLoader.js'),
			import('three/examples/jsm/loaders/MTLLoader.js')
		]);

		if (!canvasEl) return;

		// 1. Nastavení Three.js scény s ortografickou kamerou (paralelní axonometrický pohled bez perspektivního zkreslení)
		const scene = new THREE.Scene();

		const frustumSize = 3.3;
		const camera = new THREE.OrthographicCamera(
			-frustumSize / 2,
			frustumSize / 2,
			frustumSize / 2,
			-frustumSize / 2,
			0.1,
			100
		);
		camera.position.set(0, 0, 20);
		camera.lookAt(0, 0, 0);

		renderer = new THREE.WebGLRenderer({
			canvas: canvasEl,
			alpha: true,
			antialias: true,
			powerPreference: 'high-performance'
		});
		renderer.setSize(size, size, false);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

		// 2. Osvětlení ladící k barvám a stínům reálného 3D loga
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
		scene.add(ambientLight);

		// Hlavní světlo shora zleva
		const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
		mainLight.position.set(-3, 4, 5);
		scene.add(mainLight);

		// Doplňkové světlo s modrým akcentem zespodu zprava
		const fillLight = new THREE.DirectionalLight(0x0099ff, 1.2);
		fillLight.position.set(4, -3, 3);
		scene.add(fillLight);

		// Zpětné obrysové světlo (rim light)
		const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
		rimLight.position.set(3, 4, -4);
		scene.add(rimLight);

		// 3. Skupina pro model
		const modelGroup = new THREE.Group();
		scene.add(modelGroup);

		// Inicializace rotace
		currentRot = { ...initRotRad };
		targetRot = { ...initRotRad };
		modelGroup.rotation.set(currentRot.x, currentRot.y, currentRot.z);

		// Výchozí metalický PBR materiál pro OBJ bez materiálů (odpovídá reálnému modrému 3D renderu)
		const defaultMascotMaterial = new THREE.MeshStandardMaterial({
			color: 0x0095f8,
			metalness: 0.72,
			roughness: 0.28
		});

		function setupLoadedObject(object3D, applyMaterialIfMissing = true) {
			object3D.traverse((child) => {
				if (child.isMesh) {
					if (child.geometry && !child.geometry.attributes.normal) {
						child.geometry.computeVertexNormals();
					}
					// Aplikace nebo vylepšení na věrný PBR standardní materiál
					const baseColor = (child.material && child.material.color)
						? child.material.color.clone()
						: new THREE.Color(0x0095f8);

					child.material = new THREE.MeshStandardMaterial({
						color: baseColor,
						metalness: 0.70,
						roughness: 0.28
					});
				}
			});

			const boxBefore = new THREE.Box3().setFromObject(object3D);
			const sizeBefore = boxBefore.getSize(new THREE.Vector3());
			const centerBefore = boxBefore.getCenter(new THREE.Vector3());

			// Posun geometrie do středu pivotu
			object3D.position.sub(centerBefore);

			const pivot = new THREE.Group();
			pivot.add(object3D);

			// Automatická detekce a otočení Z-up modelů do Fusion 360 Home pohledu zespodu na pravou stranu
			if (sizeBefore.z > sizeBefore.y * 1.2) {
				pivot.rotation.set(-125.2644 * DEG2RAD, 0, -45 * DEG2RAD);
			}

			// Normalizace měřítka, aby model přirozeně vyplnil kontejner
			const maxDim = Math.max(sizeBefore.x, sizeBefore.y, sizeBefore.z);
			if (maxDim > 0) {
				const targetSize = 2.5 * scale;
				const normScale = targetSize / maxDim;
				pivot.scale.setScalar(normScale);
			}

			modelGroup.clear();
			modelGroup.add(pivot);
		}

		// Pomocná funkce pro načtení OBJ modelu (s volitelným MTL)
		async function loadObjModel(objPath) {
			const mtlPath = objPath.replace(/\.obj$/i, '.mtl');
			let materials = null;

			try {
				const mtlLoader = new MTLLoader();
				materials = await new Promise((resolve, reject) => {
					mtlLoader.load(mtlPath, resolve, undefined, reject);
				});
				materials.preload();
			} catch (_) {
				// MTL soubor není povinný, použije se náš PBR materiál
			}

			return new Promise((resolve, reject) => {
				const objLoader = new OBJLoader();
				if (materials) {
					objLoader.setMaterials(materials);
				}
				objLoader.load(
					objPath,
					(obj) => {
						setupLoadedObject(obj, !materials);
						resolve(obj);
					},
					undefined,
					reject
				);
			});
		}

		// Pomocná funkce pro načtení GLTF / GLB modelu
		function loadGltfModel(gltfPath) {
			return new Promise((resolve, reject) => {
				const gltfLoader = new GLTFLoader();
				gltfLoader.load(
					gltfPath,
					(gltf) => {
						setupLoadedObject(gltf.scene, false);
						resolve(gltf.scene);
					},
					undefined,
					reject
				);
			});
		}

		// 4. Inteligentní načítání modelu (.glb / .obj s automatickým fallbackem)
		async function load3DAsset() {
			const isObj = src.toLowerCase().endsWith('.obj');
			const isGlb = src.toLowerCase().endsWith('.glb') || src.toLowerCase().endsWith('.gltf');

			// Určení pořadí zkoušení podle zadaného src
			const attempts = [];
			if (isObj) {
				attempts.push({ type: 'obj', path: src });
				attempts.push({ type: 'glb', path: src.replace(/\.obj$/i, '.glb') });
			} else if (isGlb) {
				attempts.push({ type: 'glb', path: src });
				attempts.push({ type: 'obj', path: src.replace(/\.(glb|gltf)$/i, '.obj') });
			} else {
				attempts.push({ type: 'glb', path: '/models/logo.glb' });
				attempts.push({ type: 'obj', path: '/models/logo.obj' });
			}

			for (const attempt of attempts) {
				try {
					if (attempt.type === 'obj') {
						await loadObjModel(attempt.path);
					} else {
						await loadGltfModel(attempt.path);
					}
					isModelLoaded = true;
					if (isDebugMode) {
						console.log(`[Logo3D] Model '${attempt.path}' (${attempt.type.toUpperCase()}) úspěšně načten.`);
					}
					return;
				} catch (err) {
					if (isDebugMode) {
						console.info(`[Logo3D] Model '${attempt.path}' nebyl nalezen nebo se nenačetl.`);
					}
				}
			}

			// Pokud žádný 3D soubor v models/ zatím není, komponenta ponechá zobrazený fallbackSrc (/logos/logo-3d.png)
			if (isDebugMode) {
				console.info('[Logo3D] Žádný 3D model nenalezen v static/models/. Zobrazuji statický render.');
			}
		}

		load3DAsset();

		// 5. Plynulá animační smyčka
		function animate() {
			animId = requestAnimationFrame(animate);

			if (isDragging) {
				currentRot.x += (targetRot.x - currentRot.x) * 0.35;
				currentRot.y += (targetRot.y - currentRot.y) * 0.35;
			} else {
				// Tlumení setrvačnosti
				if (Math.abs(velocity.x) > 0.0001 || Math.abs(velocity.y) > 0.0001) {
					targetRot.y += velocity.x;
					targetRot.x += velocity.y;
					velocity.x *= 0.92;
					velocity.y *= 0.92;
				}

				if (autoReset && !isHovered) {
					targetRot.x += (initRotRad.x - targetRot.x) * 0.08;
					targetRot.y += (initRotRad.y - targetRot.y) * 0.08;
					targetRot.z += (initRotRad.z - targetRot.z) * 0.08;
				}

				const effectiveTargetX = targetRot.x + (isHovered && !isDragging ? hoverTilt.x : 0);
				const effectiveTargetY = targetRot.y + (isHovered && !isDragging ? hoverTilt.y : 0);

				currentRot.x += (effectiveTargetX - currentRot.x) * 0.12;
				currentRot.y += (effectiveTargetY - currentRot.y) * 0.12;
				currentRot.z += (targetRot.z - currentRot.z) * 0.12;
			}

			if (modelGroup) {
				modelGroup.rotation.set(currentRot.x, currentRot.y, currentRot.z);
			}

			renderer.render(scene, camera);
		}

		animate();

		if (isDebugMode) {
			console.log('[Logo3D] Debug mód aktivní. Otáčejte myší pro výpis hodnot pro initialRotation.');
		}
	});

	onDestroy(() => {
		if (animId) cancelAnimationFrame(animId);
		if (renderer) {
			renderer.dispose();
		}
	});

	function handlePointerDown(e) {
		isDragging = true;
		lastPointer = { x: e.clientX, y: e.clientY };
		velocity = { x: 0, y: 0 };
		if (containerEl && containerEl.setPointerCapture) {
			try {
				containerEl.setPointerCapture(e.pointerId);
			} catch (_) {}
		}
	}

	function handlePointerMove(e) {
		if (isDragging) {
			const dx = e.clientX - lastPointer.x;
			const dy = e.clientY - lastPointer.y;

			const sensitivity = 0.012;
			targetRot.y += dx * sensitivity;
			targetRot.x += dy * sensitivity;

			velocity = { x: dx * sensitivity, y: dy * sensitivity };
			lastPointer = { x: e.clientX, y: e.clientY };
		} else if (isHovered && containerEl) {
			// Jemný náklon podle pozice myši
			const rect = containerEl.getBoundingClientRect();
			const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
			const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
			hoverTilt = { x: ny * 0.15, y: nx * 0.2 };
		}
	}

	function handlePointerUp(e) {
		if (!isDragging) return;
		isDragging = false;
		if (containerEl && containerEl.releasePointerCapture) {
			try {
				containerEl.releasePointerCapture(e.pointerId);
			} catch (_) {}
		}

		// Výpis pro snadnou kalibraci výchozího natočení
		const isDebugMode = debug || (typeof window !== 'undefined' && window.location.search.includes('debug3d=1'));
		if (isDebugMode) {
			const degX = Math.round((targetRot.x * RAD2DEG) % 360);
			const degY = Math.round((targetRot.y * RAD2DEG) % 360);
			const degZ = Math.round((targetRot.z * RAD2DEG) % 360);
			console.log(`[Logo3D] initialRotation={{ x: ${degX}, y: ${degY}, z: ${degZ} }}`);
		}
	}

	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
		hoverTilt = { x: 0, y: 0 };
		if (autoReset && !isDragging) {
			targetRot.x = initRotRad.x;
			targetRot.y = initRotRad.y;
			targetRot.z = initRotRad.z;
		}
	}

	function handleDoubleClick() {
		targetRot.x = initRotRad.x;
		targetRot.y = initRotRad.y;
		targetRot.z = initRotRad.z;
		velocity = { x: 0, y: 0 };
	}
</script>

<div
	bind:this={containerEl}
	class="logo-3d-wrapper intro-logo-3d"
	class:is-dragging={isDragging}
	class:is-hovered={isHovered}
	style="width: {size}px; height: {size}px;"
	role="img"
	aria-label={alt}
	title="Otáčejte 3D logem tažením myši (dvojklik pro reset)"
	on:pointerdown={handlePointerDown}
	on:pointermove={handlePointerMove}
	on:pointerup={handlePointerUp}
	on:pointercancel={handlePointerUp}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:dblclick={handleDoubleClick}
>
	<!-- WebGL Plátno -->
	<canvas
		bind:this={canvasEl}
		class="logo-3d-canvas"
		class:visible={isModelLoaded}
		width={size}
		height={size}
	></canvas>

	<!-- Záložní obrázek pro SSR a dobu načítání -->
	{#if !isModelLoaded}
		<img
			src={fallbackSrc}
			{alt}
			class="logo-3d-fallback"
			width={size}
			height={size}
		/>
	{/if}
</div>

<style>
	.logo-3d-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		user-select: none;
		touch-action: none;
		overflow: hidden;
		background: transparent;
		padding: 0;
	}

	.logo-3d-wrapper.is-dragging {
		cursor: grabbing;
	}

	.logo-3d-canvas {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: inherit;
		opacity: 0;
		transition: opacity 0.25s ease;
		pointer-events: none;
	}

	.logo-3d-canvas.visible {
		opacity: 1;
	}

	.logo-3d-fallback {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: inherit;
		pointer-events: none;
	}
</style>
