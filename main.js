import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// loading screen
const loadingScreen = document.querySelector(".loadingScreen");
const startButton = document.getElementById("start-button");
const loadingText = document.getElementById("loading-text");

const loadingMessages = [
    "🌲 Growing the forest...",
    "🍎 Stocking the market...",
    "📚 Organizing the library...",
    "☀️ Charging the solar car...",
    "🚀 Almost ready..."
];

let character = {
    instance: null,
    moveDistance: 3,
    jumpHeight: 1,
    isMoving: false,
    moveDuration: 0.2,
};
let loadingMessageIndex = 0;
let loadingMessageTimer = null;
let experienceReady = false;

function startLoadingMessages() {
    loadingMessageTimer = window.setInterval(() => {
        loadingMessageIndex =
            (loadingMessageIndex + 1) % loadingMessages.length;

        loadingText.textContent =
            loadingMessages[loadingMessageIndex];
    }, 1000);
}

function finishLoading() {
    experienceReady = true;

    if (loadingMessageTimer !== null) {
        clearInterval(loadingMessageTimer);
    }

    loadingText.textContent = "Click Start to Begin";
    startButton.classList.add("visible");
}

startLoadingMessages();

// actual screen
const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}



const modalContent = {
    "Tree": {
        title: "My First Tree",
        content: "This is project one. Hello World.",
    },
    "solarcarHelios": {
        title: "Solar Car",
        content: "This is project one. Hello World.",
        link: "https://example.com/",
    },
    "Sci-fi_Low_Poly_ComputervScreen": {
        title: "Welcome",
        content: "This is project one. Hello World."  ,
        link: "https://example.com/",
    },
    "Lowpoly_Apples_(Red_&_Green)": {
        title: "Stored in Inventory!",
        content: "This is project one. Hello World.",
    },
    "Lowpoly_Apples_(Red_&_Green)001": {
        title: "Stored in Inventory!",
        content: "This is project one. Hello World.",
    },
    "Lowpoly_Apples_(Red_&_Green)002": {
        title: "Stored in Inventory!",
        content: "This is project one. Hello World.",
    },
    "Lowpoly_Apples_(Red_&_Green)003": {
        title: "Stored in Inventory!",
        content: "This is project one. Hello World.",
    },
    "Low_Poly_Minimarket": {
        title: "Welcome to the Minimarket!",
        content: "This is project one. Hello World.",
    }, // shop
    "House_Low_Poly": {
        title: "Shh! This is the Library",
        content: "This is project one. Hello World.",
        link: "https://example.com/",
    }, // library
    "Lowpoly_building": {
        title: "Project One",
        content: "This is project one. Hello World.",
        link: "https://example.com/",
    }, // hospital
    "Coffee_Shop_3d_graphic_illustration": {
        title: "Cafe Fennyk",
        content: "This is project one. Hello World.",
    },  // cafe
    "Coffee_Shop_3d_graphic_illustration001": {
        title: "Welcome to the Local Farmers Market",
        content: "This is project one. Hello World.",
    }, //grocery store
    "Low_Poly_Tomato_Crate": {
        title: "Stored in Inventory!",
        content: "This is project one. Hello World.",
    },
    "Low_Poly_Fruit_Manggo": {
        title: "Stored in Inventory!",
        content: "This is project one. Hello World.",
    },
    "Low_Poly_Fruit_Manggo001": {
        title: "Stored in Inventory!",
        content: "This is project one. Hello World.",
    },
    // "Cube001": {
    //     title: "Project One",
    //     content: "This is project one. Hello World."
    //     link: "https://example.com/",
    // }, // bear
    "Plane186": {
        title: "Do you want to dive in the sea?",
        content: "I can because I'm a certified scuba diver 😝🤿.",
    } // sea
}

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDescription = document.querySelector(".modal-project-description");
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitProjectButton = document.querySelector(".modal-project-visit-button");

function showModal(id){
    const content = modalContent[id];
    if(content){
        modalTitle.textContent = content.title;
        modalProjectDescription.textContent = content.content;
        if(content.link){
            modalVisitProjectButton.href = content.link;
            modalVisitProjectButton.classList.remove('hidden');
        } else{
            modalVisitProjectButton.classList.add('hidden');
        }
        modal.classList.toggle("hidden");
    }
}

function hideModal(){
    modal.classList.toggle("hidden");
}



let intersectObject = "";
const intersectObjects = [];
const intersectObjectsNames = [
    "Tree",
    "solarcarHelios",
    "Sci-fi_Low_Poly_ComputervScreen",
    "Lowpoly_Apples_(Red_&_Green)",
    "Lowpoly_Apples_(Red_&_Green)001",
    "Lowpoly_Apples_(Red_&_Green)002",
    "Lowpoly_Apples_(Red_&_Green)003",
    "Low_Poly_Minimarket", // shop
    "House_Low_Poly", // library
    "Lowpoly_building", // hospital
    "Coffee_Shop_3d_graphic_illustration",  // cafe
    "Coffee_Shop_3d_graphic_illustration001", //grocery store
    "Low_Poly_Tomato_Crate",
    "Low_Poly_Fruit_Manggo",
    "Low_Poly_Fruit_Manggo001",
    // "Cube001", // bear
    "Plane186" // sea
]


const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// loading the blender model
const loader = new GLTFLoader();
loader.load(
    "./portfolio8.glb",

    // Model loaded
    function (glb) {
        console.log(glb.scene);

        glb.scene.traverse((child) => {
            if (intersectObjectsNames.includes(child.name)) {
                intersectObjects.push(child);
            }

            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.name.includes("Plane186")) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x55dfe5,
                        transparent: true,
                        opacity: 0.8,
                        roughness: 0.3,
                        metalness: 0,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });

                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.renderOrder = 1;
                    child.position.y += 0.01;
                }
            }

            if (child.name === "Cube001"){
                character.instance = child;
            }
        });

        scene.add(glb.scene);
        finishLoading();

    },
    undefined,
    // Loading error
    function (error) {
        console.error("Error loading model:", error);
        loadingText.textContent = "Could not load the experience.";
    }
);


// light

const ambientLight = new THREE.HemisphereLight(
    0xffffff, // sky
    0x8a9a72, // ground bounce
    1.5
);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xfff1d6, 1.5);
sun.position.set(-20, 35, 25);
sun.target.position.set(0, 0, 0);

scene.add(sun);
scene.add(sun.target);

sun.castShadow = true;

sun.shadow.mapSize.set(4096, 4096);

sun.shadow.camera.left = -25;
sun.shadow.camera.right = 125;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 200;

sun.shadow.camera.updateProjectionMatrix();

sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.04;
sun.shadow.radius = 4;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const directionalHelper = new THREE.DirectionalLightHelper(sun, 5);
scene.add(directionalHelper);

const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
scene.add(shadowHelper);

scene.background = new THREE.Color(0xaedce5);
renderer.setClearColor(0x9ed7e5);

// camera
const camera = new THREE.PerspectiveCamera(
    35,
    sizes.width / sizes.height,
    0.1,
    100
);

camera.position.set(8, 7, 11);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.update();




// music

// -------------------- MUSIC PLAYLIST --------------------

const playlist = [
    new Audio("./assets/music/Baguira.mp3"),
    new Audio("./assets/music/Boy.mp3"),
    new Audio("./assets/music/Sudo.mp3")
];

const MAX_VOLUME = 0.25;
const FADE_DURATION = 3000; // 3 seconds

let currentTrack = 0;
let isTransitioning = false;
let musicStarted = false;

playlist.forEach((track) => {
    track.volume = MAX_VOLUME;
    track.preload = "auto";
});

function crossfadeTo(nextIndex) {
    if (isTransitioning) return;

    isTransitioning = true;

    const current = playlist[currentTrack];
    const next = playlist[nextIndex];

    next.pause();
    next.currentTime = 0;
    next.volume = 0;

    next.play().catch((error) => {
        console.error("Could not play next track:", error);
        isTransitioning = false;
    });

    const fadeStart = performance.now();

    function updateFade(currentTime) {
        const progress = Math.min(
            (currentTime - fadeStart) / FADE_DURATION,
            1
        );

        current.volume = MAX_VOLUME * (1 - progress);
        next.volume = MAX_VOLUME * progress;

        if (progress < 1) {
            requestAnimationFrame(updateFade);
        } else {
            current.pause();
            current.currentTime = 0;
            current.volume = MAX_VOLUME;

            next.volume = MAX_VOLUME;

            currentTrack = nextIndex;
            isTransitioning = false;
        }
    }

    requestAnimationFrame(updateFade);
}

playlist.forEach((track, index) => {
    track.addEventListener("timeupdate", () => {
        const timeRemaining = track.duration - track.currentTime;

        if (
            musicStarted &&
            index === currentTrack &&
            !isTransitioning &&
            Number.isFinite(track.duration) &&
            timeRemaining <= FADE_DURATION / 1000
        ) {
            const nextIndex = (currentTrack + 1) % playlist.length;
            crossfadeTo(nextIndex);
        }
    });

    // Fallback in case timeupdate does not trigger near the end
    track.addEventListener("ended", () => {
        if (!isTransitioning && index === currentTrack) {
            const nextIndex = (currentTrack + 1) % playlist.length;

            currentTrack = nextIndex;
            playlist[currentTrack].currentTime = 0;
            playlist[currentTrack].volume = MAX_VOLUME;

            playlist[currentTrack].play().catch((error) => {
                console.error("Could not play track:", error);
            });
        }
    });
});

function startMusic() {
    if (musicStarted) {
        return Promise.resolve();
    }

    musicStarted = true;

    const track = playlist[currentTrack];
    track.volume = 0;

    return track.play()
        .then(() => {
            const fadeStart = performance.now();

            function fadeIn(now) {
                const progress = Math.min(
                    (now - fadeStart) / FADE_DURATION,
                    1
                );

                track.volume = MAX_VOLUME * progress;

                if (progress < 1) {
                    requestAnimationFrame(fadeIn);
                } else {
                    track.volume = MAX_VOLUME;
                }
            }

            requestAnimationFrame(fadeIn);
        })
        .catch((error) => {
            musicStarted = false;
            throw error;
        });
}
// Browsers require the user to interact before audio can play
// window.addEventListener("click", startMusic, { once: true });

// --------------------------------------------------------


// -------------------- MOUSE CLICKS --------------------

const sounds = {
    open: new Audio("./assets/music/old_radio_button.mp3"),
    // open: new Audio("./assets/music/mouse_click.mp3"),
    close: new Audio("./assets/music/Source Metal Clicks Delicate Light Sharp Clip Mid 07.mp3")
};

Object.values(sounds).forEach(sound => {
    sound.preload = "auto";
    sound.volume = 0.3;
});

function playSound(name, volume = 0.3) {
    const sound = sounds[name].cloneNode();

    sound.volume = volume;

    sound.playbackRate =
        0.95 + Math.random() * 0.1;

    sound.play();
}

// --------------------------------------------------------




function handleResize(){
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function handlePointerMove(event) {
    const rect = canvas.getBoundingClientRect();

    pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleClick(){
    // console.log(intersectObject);
    if(intersectObject !== ""){
        playSound("open", 0.4);
        showModal(intersectObject);
    }
}

function findInteractiveObjectName(object) {
    let currentObject = object;

    while (currentObject) {
        if (intersectObjectsNames.includes(currentObject.name)) {
            return currentObject.name;
        }

        currentObject = currentObject.parent;
    }

    return "";
}

function moveCharacter(targetPosition, targetRotation){
    isMoving = true;
    const t1 = gsap.timeline()

    // ur here khadeejaaaaaaaaaaa
}

function onKeyDown(event){
    if (isMoving) return;

    const targetPosition = new THREE.Vector3().copy(character.instance.position);
    let targetRotation = 0;
    switch(event.key.toLowerCase()){
        case "w":
        case "arrowup":
            targetPosition.z += character.moveDistance;
            targetRotation = 0;
            break
        case "s":
        case "arrowdown":
            targetPosition.z -= character.moveDistance;
            targetRotation = Math.PI;
            break
        case "a":
        case "arrowleft":
            targetPosition.x += character.moveDistance;
            targetRotation = Math.PI/2;
            break
        case "d":
        case "arrowright":
            targetPosition.x -= character.moveDistance;
            targetRotation = -Math.PI;
            break
        default:
            return;
    }
    moveCharacter(targetPosition, targetRotation);

}

startButton.addEventListener("click", async () => {
    if (!experienceReady) return;

    startButton.disabled = true;
    startButton.style.animation = "none";

    try {
        await startMusic();
    } catch (error) {
        console.warn("Music could not start:", error);
    }

    setTimeout(() => {
        document.body.classList.add("experience-started");
        loadingScreen.classList.add("hidden");
    }, 300);
});
modalExitButton.addEventListener("click", () => {
    playSound("close");
    hideModal();
});
window.addEventListener("resize", handleResize); 
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("click", handleClick);
window.addEventListener("keydown", onKeyDown);

function animate() {
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(
        intersectObjects,
        true
    );

    if (intersects.length > 0) {
        intersectObject = findInteractiveObjectName(
            intersects[0].object
        );

        document.body.style.cursor =
            intersectObject ? "pointer" : "default";
    } else {
        intersectObject = "";
        document.body.style.cursor = "default";
    }

    controls.update();
    renderer.render(scene, camera);
}
renderer.setAnimationLoop( animate );


