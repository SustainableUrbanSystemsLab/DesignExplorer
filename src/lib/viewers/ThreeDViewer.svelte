<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  import { STLLoader } from 'three/addons/loaders/STLLoader.js';
  import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
  import { dataset } from '../stores/dataset.svelte';
  import { selection } from '../stores/selection.svelte';
  import { detectModelFormat } from '../types/data';

  let containerEl: HTMLDivElement;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let controls: OrbitControls;
  let currentModel: THREE.Object3D | null = null;
  let animationId: number;

  /** Which 3D column to display */
  let activeThreeDCol = $state<string>('');

  $effect(() => {
    const cols = dataset.threeDColumns;
    if (cols.length > 0 && !activeThreeDCol) {
      activeThreeDCol = cols[0].originalName;
    }
  });

  let modelUrl = $derived.by(() => {
    if (!selection.highlighted || !activeThreeDCol) return '';
    const path = selection.highlighted[activeThreeDCol];
    if (typeof path !== 'string' || !path) return '';
    return dataset.resolveAssetUrl(path);
  });

  onMount(() => {
    initScene();
    animate();

    const observer = new ResizeObserver(() => handleResize());
    observer.observe(containerEl);

    return () => {
      observer.disconnect();
    };
  });

  onDestroy(() => {
    cancelAnimationFrame(animationId);
    renderer?.dispose();
    controls?.dispose();
  });

  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000);
    camera.position.set(5, 5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    containerEl.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-10, 5, -10);
    scene.add(dirLight2);

    // Grid
    const grid = new THREE.GridHelper(20, 20, 0x444466, 0x333355);
    scene.add(grid);

    handleResize();
  }

  function handleResize() {
    if (!renderer || !containerEl) return;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls?.update();
    renderer?.render(scene, camera);
  }

  async function loadModel(url: string) {
    // Remove previous model
    if (currentModel) {
      scene.remove(currentModel);
      currentModel = null;
    }

    if (!url) return;

    const format = detectModelFormat(url);

    try {
      let object: THREE.Object3D;

      if (format === 'gltf' || format === 'glb') {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        object = gltf.scene;
      } else if (format === 'stl') {
        const loader = new STLLoader();
        const geometry = await loader.loadAsync(url);
        const material = new THREE.MeshPhongMaterial({
          color: 0x4a90d9,
          specular: 0x111111,
          shininess: 30,
        });
        object = new THREE.Mesh(geometry, material);
      } else if (format === 'obj') {
        const loader = new OBJLoader();
        object = await loader.loadAsync(url);
      } else {
        console.warn(`Unsupported 3D format: ${url}`);
        return;
      }

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;

      object.scale.setScalar(scale);
      object.position.sub(center.multiplyScalar(scale));

      scene.add(object);
      currentModel = object;

      // Adjust camera
      camera.position.set(5, 5, 5);
      controls.target.set(0, 0, 0);
      controls.update();
    } catch (error) {
      console.error('Failed to load 3D model:', error);
    }
  }

  // React to model URL changes
  $effect(() => {
    loadModel(modelUrl);
  });
</script>

<div class="w-full h-full flex flex-col bg-gray-900">
  <!-- 3D column selector -->
  {#if dataset.threeDColumns.length > 1}
    <div class="flex gap-1 p-1 bg-gray-800">
      {#each dataset.threeDColumns as col}
        <button
          class="px-2 py-0.5 text-xs rounded transition-colors
            {activeThreeDCol === col.originalName
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'}"
          onclick={() => (activeThreeDCol = col.originalName)}
        >
          {col.displayName}
        </button>
      {/each}
    </div>
  {/if}

  <div bind:this={containerEl} class="flex-1 relative">
    {#if !modelUrl && !selection.highlighted}
      <div class="absolute inset-0 flex items-center justify-center text-gray-600 text-sm pointer-events-none">
        Hover or click a design to view 3D model
      </div>
    {/if}
  </div>
</div>
