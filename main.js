import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBB } from "three/addons/math/OBB.js";

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
    jumpHeight: .5,
    isMoving: false,
    moveDuration: 0.2,
};

let inventoryTimeout = null;

let loadingMessageIndex = 0;
let loadingMessageTimer = null;
let experienceReady = false;

let nameMesh = null;
let namePivot = null;
let nameKnockedOver = false;

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
// hit boxes
const colliders = [];
const orientedColliders = [];

const nameTriggers = [];
const letterObjects = [];
let lettersKnockedOver = false;

const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const BEAR_ROTATION_OFFSET = Math.PI / 4;

const MAP_BOUNDS = {
    minX: -70,
    maxX: 110,
    minZ: -25,
    maxZ: 110
};

// fruit prices
const fruitPrices = {
    apples: 2,
    mangoes: 4,
    tomatoes: 3
};

const modalContent = {
    "Tree": {
        title: "My First Tree",
        content: "I started learning how to use Blender about a month ago in May 2026. This was my first tree!",
    },
    "solarcarHelios": {
        title: "Solar Car",
        caseStudy: true,

        content: `
            <section class="project-overview">
                <p>
                    During my time on the
                    <strong>University of Calgary Solar Car Team</strong>,
                    I developed the
                    <strong>Battery Protection System (BPS)</strong>, the
                    vehicle's most safety-critical embedded systems.
                </p>
            </section>


            <section class="project-info">

                <div class="info-card">
                    <span class="label">Role</span>
                    <span class="value">Technical Lead</span>
                </div>

                <div class="info-card">
                    <span class="label">Duration</span>
                    <span class="value">2022–2026</span>
                </div>

                <div class="info-card full-width">
                    <span class="label">Technologies</span>

                    <div class="tech-stack">
                        <span>Embedded C</span>
                        <span>STM32</span>
                        <span>CAN</span>
                        <span>FreeRTOS</span>
                        <span>ADC</span>
                        <span>Git</span>
                    </div>

                </div>

            </section>
            <!-- MEDIA -->
            <section class="project-gallery">

                <figure>
                    <img src="./assets/imgs/teamPhoto.png" alt="">
                    <figcaption>FSGP 2026 Team Photo</figcaption>
                </figure>

                <figure>
                    <video controls muted playsinline>
                        <source src="./assets/imgs/embedded.mp4" type="video/mp4">
                    </video>

                    <figcaption>
                        Bench testing the Battery Protection System and CAN communication.
                    </figcaption>
                </figure>

            </section>

            <!-- INFO -->

            <section class="project-highlights">

                <h2>Highlights</h2>

                <div class="highlight">
                    ✓ Restored vehicle operability under extreme time pressure during
                    Formula Sun Grand Prix 2025 while serving as the sole embedded
                    lead on-site.
                </div>

                <div class="highlight">
                    ✓ Worked closely with the electrical team to diagnose hardware issues by analyzing embedded software behavior.
                </div>

                <div class="highlight">
                    ✓ Built safety-critical firmware for contactor control, battery
                    monitoring, and fault handling.
                </div>

                <div class="highlight">
                    ✓ Collaborated with electrical and mechanical subteams to resolve
                    race-critical issues.
                </div>

                <div class="highlight">
                    ✓ Expanded technical documentation and onboarding resources for
                    future embedded developers.
                </div>

            </section>
        `,

        link: "https://github.com/UCSolarCarTeam/Helios-CPP-Race-2025-BMSContactor"
    },
    "Sci-fi_Low_Poly_ComputervScreen": {
        title: "Welcome 👋",
        content: "My name is Khadeeja Abbas and this is my portfolio! I've scattered displays of the projects I've been working on throughout the world. As you explore, you can also collect fruit and trade it for coins at the market!"  ,
        // link: "https://www.linkedin.com/in/khadeejaa/",
    },
    "Lowpoly_Apples_(Red_&_Green)": {
        title: "Stored in Inventory!",
        // content: "This is project one. Hello World.",
    },
    "Lowpoly_Apples_(Red_&_Green)001": {
        title: "Stored in Inventory!",
        // content: "This is project one. Hello World.",
    },
    "Lowpoly_Apples_(Red_&_Green)002": {
        title: "Stored in Inventory!",
        // content: "This is project one. Hello World.",
    },
    "Lowpoly_Apples_(Red_&_Green)003": {
        title: "Stored in Inventory!",
        // content: "This is project one. Hello World.",
    },
    "Low_Poly_Minimarket": {
        title: "Local Minimarket",
        shop: true,

        content: `
            <div class="market-shop">

                <section class="market-intro">
                    <p>
                        Trade the fruit you collected for coins!
                    </p>

                    <div class="market-wallet">
                        🪙 You currently have
                        <strong id="market-coin-count">0</strong>
                        coins
                    </div>
                </section>

                <div class="market-items">

                    <div class="market-item">
                        <div class="market-item-info">
                            <span class="market-fruit">🍎</span>

                            <div>
                                <h3>Apples</h3>
                                <p>
                                    You have:
                                    <strong id="market-apple-count">0</strong>
                                </p>
                                <span>Worth 2 coins each</span>
                            </div>
                        </div>

                        <div class="market-actions">
                            <button
                                type="button"
                                class="sell-fruit-button"
                                data-fruit="apples"
                                data-amount="1"
                            >
                                Sell 1
                            </button>

                            <button
                                type="button"
                                class="sell-fruit-button sell-all-button"
                                data-fruit="apples"
                                data-amount="all"
                            >
                                Sell All
                            </button>
                        </div>
                    </div>


                    <div class="market-item">
                        <div class="market-item-info">
                            <span class="market-fruit">🥭</span>

                            <div>
                                <h3>Mangoes</h3>
                                <p>
                                    You have:
                                    <strong id="market-mango-count">0</strong>
                                </p>
                                <span>Worth 4 coins each</span>
                            </div>
                        </div>

                        <div class="market-actions">
                            <button
                                type="button"
                                class="sell-fruit-button"
                                data-fruit="mangoes"
                                data-amount="1"
                            >
                                Sell 1
                            </button>

                            <button
                                type="button"
                                class="sell-fruit-button sell-all-button"
                                data-fruit="mangoes"
                                data-amount="all"
                            >
                                Sell All
                            </button>
                        </div>
                    </div>


                    <div class="market-item">
                        <div class="market-item-info">
                            <span class="market-fruit">🍅</span>

                            <div>
                                <h3>Tomatoes</h3>
                                <p>
                                    You have:
                                    <strong id="market-tomato-count">0</strong>
                                </p>
                                <span>Worth 3 coins each</span>
                            </div>
                        </div>

                        <div class="market-actions">
                            <button
                                type="button"
                                class="sell-fruit-button"
                                data-fruit="tomatoes"
                                data-amount="1"
                            >
                                Sell 1
                            </button>

                            <button
                                type="button"
                                class="sell-fruit-button sell-all-button"
                                data-fruit="tomatoes"
                                data-amount="all"
                            >
                                Sell All
                            </button>
                        </div>
                    </div>

                </div>

                <p
                    id="market-message"
                    class="market-message"
                    aria-live="polite"
                ></p>

            </div>
        `
    },  // shop
    "House_Low_Poly": {
        title: "Shh! This is the Library",
        link: "https://www.goodreads.com/user/show/185506051-khadeeja-abbas",
    }, // library
    "Lowpoly_building": {
    title: "Dr. James White's Lab",
        caseStudy: true,

        content: `
            <section class="project-overview">
                <p>
                    As a Honours Student in
                    <strong>Dr. James White's Nelson Pulse Research Centre</strong>,
                    I developed an artificial intelligence framework to
                    <strong> automatically identify cardiac scar tissue from MRI scans. 
                    By replacing time-consuming manual analysis with an automated pipeline,
                    the project aimend to improve speed, consistency, and accessbility of cardiovascular imaging. 
                </p>
            </section>
            <section class="project-info">

                <div class="info-card">
                    <span class="label">Role</span>
                    <span class="value">Honours Student</span>
                </div>

                <div class="info-card">
                    <span class="label">Duration</span>
                    <span class="value">2025-2026</span>
                </div>

                <div class="info-card full-width">
                    <span class="label">Technologies</span>

                    <div class="tech-stack">
                        <span>Python</span>
                        <span>PyTorch</span>
                        <span>OpenCV</span>
                        <span>NumPy</span>
                        <span>Medical Imaging</span>
                        <span>Deep Learning</span>
                    </div>

                </div>

            </section>
            <!-- MEDIA -->
            <section class="project-gallery">

                <figure>
                    <img src="./assets/imgs/research.JPG" alt="">
                    <figcaption>
                        Presenting my research at the Tine Haworth Cardiovascular Research Day.
                    </figcaption>
                </figure>
                 <figure>

                    <img src="./assets/imgs/heart.png" alt="">
                    <figcaption>
                        Demonstration of the automated fibrosis segmentation.
                    </figcaption>
                </figure>

            </section>

            <!-- INFO -->

            <section class="project-highlights">

                <h2>Highlights</h2>

                <div class="highlight">
                    ✓ Developed a fully automated pipeline for myocardial fibrosis
                    segmentation from LGE cardiac MRI, eliminating the need for
                    manual reference myocardium selection.
                </div>

                <div class="highlight">
                    ✓ Designed an automated reference myocardium detection method
                    using Otsu thresholding to standardize fibrosis quantification.
                </div>

                <div class="highlight">
                    ✓ Evaluated the framework on a large cardiac MRI dataset
                    containing multiple cardiovascular pathologies.
                </div>

                <div class="highlight">
                    ✓ Presented research findings through scientific posters,
                    reports, and ongoing manuscript preparation.
                </div>

            </section>
        `,

        link: "https://nelsonpulsecentre.ca"
    }, // hospital
"Coffee_Shop_3d_graphic_illustration": {
    title: "Cafe Fennyk",
    cafe: true,

    content: `
        <div class="cafe-shop">

            <div class="cafe-drink">
                <div class="cafe-drink-info">
                    <span class="cafe-drink-icon">☕</span>

                    <div>
                        <h3>Bear’s Café Drink</h3>
                        <p>A warm drink for the journey.</p>

                        <div class="cafe-price">
                            Cost: <strong>10 coins</strong>
                        </div>
                    </div>
                </div>

                <div class="cafe-wallet">
                    🪙 You have
                    <strong id="cafe-coin-count">0</strong>
                    coins
                </div>

                <button
                    type="button"
                    id="buy-drink-button"
                    class="buy-drink-button"
                >
                    Buy Drink
                </button>

                <p
                    id="cafe-message"
                    class="cafe-message"
                    aria-live="polite"
                ></p>
            </div>

        </div>
    `
},  // cafe
    "Coffee_Shop_3d_graphic_illustration001": {
        title: "Welcome to the Local Farmers Market",
        content: "Closed on most days, try again another day!",
    }, //grocery store
    "Low_Poly_Tomato_Crate": {
        title: "Stored in Inventory!",
        // content: "This is project one. Hello World.",
    },
    "Low_Poly_Fruit_Manggo": {
        title: "Stored in Inventory!",
        // content: "This is project one. Hello World.",
    },
    "Low_Poly_Fruit_Manggo001": {
        title: "Stored in Inventory!",
        // content: "This is project one. Hello World.",
    },
    // "Cube001": {
    //     title: "Project One",
    //     content: "This is project one. Hello World."
    //     link: "https://example.com/",
    // }, // bear
    "Plane186": {
        title: "🤿 Scuba Fun Fact",
        content: "I'm a certified scuba diver! Maybe one day I'll build an underwater level for this portfolio.",
    } // sea
}

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDescription = document.querySelector(".modal-project-description");
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitProjectButton = document.querySelector(".modal-project-visit-button");
let modalTimeout = null;

// function showModal(id) {
//     const content = modalContent[id];

//     if (!content) return;

//     modalTitle.textContent = content.title;
//     modalProjectDescription.innerHTML = content.content || "";

//     if (content.shop === true) {
//         updateMarketDisplay();
//     }
//     if (content.cafe === true) {
//         updateCafeDisplay();
//     }
//     if (content.link) {
//         modalVisitProjectButton.href = content.link;
//         modalVisitProjectButton.classList.remove("hidden");
//     } else {
//         modalVisitProjectButton.classList.add("hidden");
//     }

//     modal.classList.toggle(
//         "case-study-modal",
//         content.caseStudy === true
//     );

//     modal.classList.remove("hidden");
// }


function showModal(id) {
    const content = modalContent[id];

    if (!content) return;

    modalTitle.textContent = content.title;
    modalProjectDescription.innerHTML = content.content || "";

    // Clear any previous timer
    clearTimeout(modalTimeout);

    if (content.shop === true) {
        updateMarketDisplay();
    }

    if (content.cafe === true) {
        updateCafeDisplay();
    }

    if (content.link) {
        modalVisitProjectButton.href = content.link;
        modalVisitProjectButton.classList.remove("hidden");
    } else {
        modalVisitProjectButton.classList.add("hidden");
    }

    modal.classList.toggle(
        "case-study-modal",
        content.caseStudy === true
    );

    modal.classList.remove("hidden");

    // Auto-close only inventory pickups
    if (content.title === "Stored in Inventory!") {
    modal.classList.add("pickup-modal");
    } else {
        modal.classList.remove("pickup-modal");
    }
    if (content.title === "Stored in Inventory!") {
        modalTimeout = setTimeout(() => {
            hideModal();
        }, 2000);
    }
}
function hideModal() {
    modal.classList.add("hidden");
    modal.classList.remove("case-study-modal");
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

const jumpObjects = [
    "Lowpoly_Apples_(Red_&_Green)",
    "Lowpoly_Apples_(Red_&_Green)001",
    "Lowpoly_Apples_(Red_&_Green)002",
    "Lowpoly_Apples_(Red_&_Green)003",
    "Low_Poly_Tomato_Crate",
    "Low_Poly_Fruit_Manggo",
    "Low_Poly_Fruit_Manggo001"
];


// fog 
scene.fog = new THREE.Fog(0xaedce5, 35, 80);

//leaves
// -------------------- GROUND LEAVES --------------------

const LEAF_COUNT = 250;

const leafGeometry = new THREE.PlaneGeometry(0.18, 0.1);

const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0xd67c2d,
    side: THREE.DoubleSide,
    roughness: 1
});

const groundLeaves = new THREE.InstancedMesh(
    leafGeometry,
    leafMaterial,
    LEAF_COUNT
);

// Leaves do not need shadows
groundLeaves.castShadow = false;
groundLeaves.receiveShadow = false;

const leafDummy = new THREE.Object3D();

const leafColors = [
    new THREE.Color(0xe09f3e), // golden
    new THREE.Color(0xc76a2c), // orange
    new THREE.Color(0xb4492d), // reddish
    new THREE.Color(0x8d5a32), // brown
    new THREE.Color(0x7da453)  // olive green
];

for (let i = 0; i < LEAF_COUNT; i++) {
    leafDummy.position.set(
        Math.random() * 80 - 40,
        0.03 + Math.random() * 0.02,
        Math.random() * 80 - 40
    );

    // Make each leaf lie flat with slight variation
    leafDummy.rotation.set(
        -Math.PI / 2 + (Math.random() - 0.5) * 0.15,
        0,
        Math.random() * Math.PI * 2
    );

    const scale = 0.7 + Math.random() * 0.8;

    leafDummy.scale.set(
        scale,
        scale,
        scale
    );

    leafDummy.updateMatrix();
    groundLeaves.setMatrixAt(i, leafDummy.matrix);
    const randomColor =
    leafColors[Math.floor(Math.random() * leafColors.length)];

    groundLeaves.setColorAt(i, randomColor);
}

groundLeaves.instanceMatrix.needsUpdate = true;
if (groundLeaves.instanceColor) {
    groundLeaves.instanceColor.needsUpdate = true;
}

scene.add(groundLeaves);


// -------------------- FALLING LEAVES --------------------
const LEAF_AREA = 35;
const fallingLeaves = [];
const FALLING_LEAF_COUNT = 40;

const fallingLeafGeometry =
    new THREE.PlaneGeometry(0.18, 0.1);

const fallingLeafColors = [
    0xe09f3e,
    0xc76a2c,
    0xb4492d,
    0x8d5a32,
    0x7da453
];

for (let i = 0; i < FALLING_LEAF_COUNT; i++) {
    const material = new THREE.MeshStandardMaterial({
        color: fallingLeafColors[
            Math.floor(Math.random() * fallingLeafColors.length)
        ],
        side: THREE.DoubleSide,
        roughness: 1
    });

    const leaf = new THREE.Mesh(
        fallingLeafGeometry,
        material
    );

    // const LEAF_AREA = 35;

    leaf.position.set(
        Math.random() * LEAF_AREA * 2 - LEAF_AREA,
        4 + Math.random() * 10,
        Math.random() * LEAF_AREA * 2 - LEAF_AREA
    );
    // leaf.position.set(
    //     Math.random() * 60 - 30,
    //     4 + Math.random() * 10,
    //     Math.random() * 60 - 30
    // );

    leaf.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    leaf.userData.fallSpeed =
        0.008 + Math.random() * 0.02;

    leaf.userData.windSpeed =
        0.005 + Math.random() * 0.012;

    leaf.userData.rotationSpeed =
        0.005 + Math.random() * 0.02;

    leaf.userData.phase =
        Math.random() * Math.PI * 2;

    leaf.castShadow = false;
    leaf.receiveShadow = false;

    scene.add(leaf);
    fallingLeaves.push(leaf);
}

// butterflies

// butterfly.position.x += 0.01;
// butterfly.position.y = 1.5 + Math.sin(time * 3) * 0.2;
 

// firelifes
new THREE.MeshStandardMaterial({
    emissive: 0xffdd55,
    emissiveIntensity: 3
});

// clouds

const clouds = [];
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    roughness: 1,
    depthWrite: false
});

function createCloud(x, y, z, scale = 1) {
    const cloud = new THREE.Group();

    const cloudParts = [
        { x: 0, y: 0, z: 0, size: 2.2 },
        { x: 1.7, y: 0.2, z: 0, size: 1.7 },
        { x: -1.7, y: 0.1, z: 0, size: 1.6 },
        { x: 0.5, y: 0.8, z: 0, size: 1.5 }
    ];

    cloudParts.forEach((part) => {
        const geometry = new THREE.SphereGeometry(part.size, 16, 12);
        const mesh = new THREE.Mesh(geometry, cloudMaterial);

        mesh.position.set(part.x, part.y, part.z);
        cloud.add(mesh);
    });

    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);

    cloud.userData.speed = 0.01 + Math.random() * 0.015;

    cloudGroup.add(cloud);
    clouds.push(cloud);
}

createCloud(-20, 19, -15, 1.3);
createCloud(10, 22, -25, 1.8);
createCloud(35, 18, 5, 1.1);
createCloud(-40, 20, 20, 1.6);

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

 

        glb.scene.traverse((child) => {
            // console.log(child.name);
            if (
                child.name === "House_Low_Poly" ||
                child.name === "Low_Poly_Minimarket" ||
                child.name === "Coffee_Shop_3d_graphic_illustration" ||
                child.name === "Low_Poly_Tomato_Crate" ||
                child.name === "solarcarHelios" ||
                child.name === "Lowpoly_building" ||
                child.name === "Coffee_Shop_3d_graphic_illustration001"
            ) {
                let box;
                if (child.name === "House_Low_Poly") {
                    const worldPosition = new THREE.Vector3();
                    child.getWorldPosition(worldPosition);

                    box = new THREE.Box3().setFromCenterAndSize(
                        new THREE.Vector3(
                            worldPosition.x + 1.2, // shift collider right
                            worldPosition.y + 2.5,
                            worldPosition.z
                        ),
                        new THREE.Vector3(
                            7.5, // width
                            5.5, // height
                            7    // depth
                        )
                    );
                }
                else if (child.name === "Coffee_Shop_3d_graphic_illustration") {
                    // Manual café collider
                    const worldPosition = new THREE.Vector3();
                    child.getWorldPosition(worldPosition);

                    box = new THREE.Box3().setFromCenterAndSize(
                        new THREE.Vector3(
                            worldPosition.x,
                            worldPosition.y + 2,
                            worldPosition.z
                        ),
                        new THREE.Vector3(
                            8,  // width
                            5,  // height
                            7   // depth
                        )
                    );
                } else {
                    box = new THREE.Box3().setFromObject(child);

                    const center = new THREE.Vector3();
                    const size = new THREE.Vector3();

                    box.getCenter(center);
                    box.getSize(size);

                    switch (child.name) {
                        case "House_Low_Poly":
                            size.x *= 0.5;
                            size.z *= 0.5;
                            break;

                        case "Lowpoly_building":
                            size.x *= 1.25;
                            size.z *= 1.25;
                            break;

                        case "Low_Poly_Minimarket":
                            size.x *= 0.65;
                            size.z *= 0.65;
                            break;

                        case "Coffee_Shop_3d_graphic_illustration001":
                            size.x *= 0.6;
                            size.z *= 0.6;
                            break;

                        case "solarcarHelios":
                            size.x *= 0.85;
                            size.z *= 0.85;
                            break;

                        case "Low_Poly_Tomato_Crate":
                            break;
                    }

                    box.setFromCenterAndSize(center, size);
                }

                colliders.push(box);

                // Keep this while adjusting
                // scene.add(new THREE.Box3Helper(box, 0xffff00));
            }

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

                    child.updateWorldMatrix(true, false);

  
                }
            }

            if (child.name === "Cube001") {
                character.instance = child;

                // Face toward the camera when the game starts
                character.instance.lookAt(camera.position);
                character.instance.rotation.x = 0;
                character.instance.rotation.z = 0;
            }
        });

        // const nameObject = glb.scene.getObjectByName("khadeeja");

        // if (nameObject) {
        //     nameObject.traverse((child) => {
        //         if (!child.isMesh) return;

        //         letterObjects.push({
        //             mesh: child,
        //             box: new THREE.Box3().setFromObject(child)
        //         });
        //     });

        //     console.log("Letter meshes:", letterObjects.length);
        // }
        nameMesh = glb.scene.getObjectByName("khadeeja");
        namePivot = new THREE.Group();

        scene.add(namePivot);

        namePivot.position.copy(nameMesh.position);

        nameMesh.position.set(0, 0, 0);

        namePivot.add(nameMesh);

        addTrigger(1, 1, 5.5, 1, 2, 1);
        addTrigger(1.8, 1, 5, 1, 2, 1);
        addTrigger(3.2, 1, 4, 2, 2, 1);

        addTrigger(4.4, 1, 2.8, 1, 2, 1);
        addTrigger(5.6, 1, 1.8, 1, 2, 1);
        addTrigger(7.0, 1, 0.8, 1, 2, 1);
        addTrigger(8.5, 1, -0.75, 2, 1, 1);

        addTrigger(9.5, 1, -2, 1, 2, 1);
        addTrigger(10.5, 1, -2.5, 1, 2, 1);
        addTrigger(11.5, 1, -3, 1, 2, 1);
        // Temporary so you can see it
        // scene.add(new THREE.Box3Helper(nameBox));

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


function addTrigger(x, y, z, sx, sy, sz) {
    const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(sx, sy, sz)
    );

    nameTriggers.push(box);

    // Temporary yellow outline
    // scene.add(new THREE.Box3Helper(box));
}

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

// const directionalHelper = new THREE.DirectionalLightHelper(sun, 5);
// scene.add(directionalHelper);

// const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
// scene.add(shadowHelper);

scene.background = new THREE.Color(0xaedce5);
renderer.setClearColor(0x9ed7e5);

// camera
const camera = new THREE.PerspectiveCamera(
    50,
    sizes.width / sizes.height,
    0.1,
    100
);

// camera.position.set(8, 7, 11);
// camera.position.set(8, 3.5, 11);
camera.position.set(12, 4, 16);

// const cameraOffset = new THREE.Vector3(8, 7, 11);
// const cameraOffset = new THREE.Vector3(8, 3.5, 11);
const cameraOffset = new THREE.Vector3(12, 4, 16);

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
    fruit: new Audio("./assets/music/shidenbeatsmusic-sound-effect-twinklesparkle-115095.mp3"), // i like this one
    // fall: new Audio("./assets/music/universfield-heavy-body-fall-352446.mp3"), // I LIKE IT
    fall: new Audio("./assets/music/dragon-studio-heavy-object-falling-515261.mp3"), // I LIKE IT
    close: new Audio("./assets/music/Source Metal Clicks Delicate Light Sharp Clip Mid 07.mp3"),
};

// const waterSound = new Audio(
//     "./assets/music/alex_jauk-walking-in-water-199418.mp3"
// );
// const waterSound = new Audio(
//     "./assets/music/alex_jauk-walking-in-water-148426.mp3"
// );

// waterSound.loop = true;
// waterSound.volume = 0.25;
// waterSound.preload = "auto";

// let waterBox = null;
// let bearIsInWater = false;

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

let isFruitJumping = false;

function jumpObject(objectName) {
    if (isFruitJumping) return;

    const mesh = scene.getObjectByName(objectName);
    if (!mesh) return;

    isFruitJumping = true;

    const startY = mesh.position.y;

    gsap.timeline({
        onComplete: () => {
            mesh.position.y = startY;
            isFruitJumping = false;
        }
    })
    .to(mesh.position, {
        y: startY + 0.5,
        duration: 0.2,
        ease: "power2.out"
    })
    .to(mesh.position, {
        y: startY,
        duration: 0.3,
        ease: "bounce.out"
    });
}

// let inventoryTimeout = null;

function showInventory() {
    inventoryPopup.classList.remove("inventory-hidden");

    clearTimeout(inventoryTimeout);

    inventoryTimeout = setTimeout(() => {
        inventoryPopup.classList.add("inventory-hidden");
    }, 2000);
}

// inventory
const inventory = {
    apples: 0,
    mangoes: 0,
    tomatoes: 0,
    coins: 0,
    drinks: 0
};

const appleCountElement =
    document.getElementById("apple-count");

const mangoCountElement =
    document.getElementById("mango-count");

const tomatoCountElement =
    document.getElementById("tomato-count");

const coinCountElement =
    document.getElementById("coin-count");

const drinkCountElement =
    document.getElementById("drink-count");

const appleObjectNames = [
    "Lowpoly_Apples_(Red_&_Green)",
    "Lowpoly_Apples_(Red_&_Green)001",
    "Lowpoly_Apples_(Red_&_Green)002",
    "Lowpoly_Apples_(Red_&_Green)003"
];

const mangoObjectNames = [
    "Low_Poly_Fruit_Manggo",
    "Low_Poly_Fruit_Manggo001"
];

const tomatoObjectNames = [
    "Low_Poly_Tomato_Crate"
];

function animateInventoryCount(element) {
    element.classList.remove("inventory-bounce");

    // Restart the CSS animation
    void element.offsetWidth;

    element.classList.add("inventory-bounce");
}

function addToInventory(objectName) {
    if (appleObjectNames.includes(objectName)) {
        inventory.apples++;

        appleCountElement.textContent =
            inventory.apples;
        showInventory();

        // animateInventoryCount(appleCountElement);
    }

    if (mangoObjectNames.includes(objectName)) {
        inventory.mangoes++;

        mangoCountElement.textContent =
            inventory.mangoes;

        showInventory();
        // animateInventoryCount(mangoCountElement);
    }

    if (tomatoObjectNames.includes(objectName)) {
        inventory.tomatoes++;

        tomatoCountElement.textContent =
            inventory.tomatoes;

        showInventory();
        // animateInventoryCount(tomatoCountElement);
    }
}


const fruitLabels = {
    apples: "apple",
    mangoes: "mango",
    tomatoes: "tomato"
};

function updateInventoryDisplay() {
    appleCountElement.textContent = inventory.apples;
    mangoCountElement.textContent = inventory.mangoes;
    tomatoCountElement.textContent = inventory.tomatoes;
    coinCountElement.textContent = inventory.coins;
    if (drinkCountElement){
        drinkCountElement.textContent = inventory.drinks;
    }
}

function updateMarketDisplay() {
    const marketAppleCount =
        document.getElementById("market-apple-count");

    const marketMangoCount =
        document.getElementById("market-mango-count");

    const marketTomatoCount =
        document.getElementById("market-tomato-count");

    const marketCoinCount =
        document.getElementById("market-coin-count");

    if (marketAppleCount) {
        marketAppleCount.textContent = inventory.apples;
    }

    if (marketMangoCount) {
        marketMangoCount.textContent = inventory.mangoes;
    }

    if (marketTomatoCount) {
        marketTomatoCount.textContent = inventory.tomatoes;
    }

    if (marketCoinCount) {
        marketCoinCount.textContent = inventory.coins;
    }

    updateSellButtons();
}

function updateSellButtons() {
    const sellButtons =
        document.querySelectorAll(".sell-fruit-button");

    sellButtons.forEach((button) => {
        const fruit = button.dataset.fruit;

        button.disabled =
            !fruit ||
            inventory[fruit] <= 0;
    });
}

function showMarketMessage(message, type = "success") {
    const messageElement =
        document.getElementById("market-message");

    if (!messageElement) return;

    messageElement.textContent = message;

    messageElement.classList.remove(
        "success",
        "error"
    );

    messageElement.classList.add(type);
}

function sellFruit(fruit, requestedAmount) {
    if (!(fruit in fruitPrices)) {
        console.error("Unknown fruit:", fruit);
        return;
    }

    const availableAmount = inventory[fruit];

    if (availableAmount <= 0) {
        showMarketMessage(
            `You don't have any ${fruit} to sell!`,
            "error"
        );

        return;
    }

    const amountToSell =
        requestedAmount === "all"
            ? availableAmount
            : Math.min(
                Number(requestedAmount),
                availableAmount
            );

    if (
        !Number.isFinite(amountToSell) ||
        amountToSell <= 0
    ) {
        return;
    }

    const coinsEarned =
        amountToSell * fruitPrices[fruit];

    inventory[fruit] -= amountToSell;
    inventory.coins += coinsEarned;

    updateInventoryDisplay();
    updateMarketDisplay();

    const singularName = fruitLabels[fruit];

    const soldName =
        amountToSell === 1
            ? singularName
            : fruit;

    showMarketMessage(
        `Sold ${amountToSell} ${soldName} for ${coinsEarned} coins!`
    );

    playSound("fruit", 0.5);
}


const DRINK_PRICE = 10;

function updateCafeDisplay() {
    const cafeCoinCount =
        document.getElementById("cafe-coin-count");

    const buyDrinkButton =
        document.getElementById("buy-drink-button");

    if (cafeCoinCount) {
        cafeCoinCount.textContent = inventory.coins;
    }

    if (buyDrinkButton) {
        buyDrinkButton.disabled =
            inventory.coins < DRINK_PRICE;
    }
}

function showCafeMessage(message, type = "success") {
    const cafeMessage =
        document.getElementById("cafe-message");

    if (!cafeMessage) return;

    cafeMessage.textContent = message;

    cafeMessage.classList.remove(
        "success",
        "error"
    );

    cafeMessage.classList.add(type);
}

function buyCafeDrink() {
    if (inventory.coins < DRINK_PRICE) {
        showCafeMessage(
            `You need ${DRINK_PRICE} coins to buy a drink!`,
            "error"
        );

        return;
    }

    inventory.coins -= DRINK_PRICE;
    inventory.drinks++;

    updateInventoryDisplay();
    updateCafeDisplay();

    showCafeMessage(
        "We got a café drink! ☕"
    );

    playSound("fruit", 0.5);
}
// function handleClick() {
//     if (intersectObject === "") return;

//     if (jumpObjects.includes(intersectObject)) {
//         jumpObject(intersectObject);
//         playSound("fruit", 0.8);

//         addToInventory(intersectObject);
//     } else {
//         playSound("open", 0.4);
//     }

//     showModal(intersectObject);
// }
function handleClick(event) {
    event.stopPropagation();

    // Clicking empty space closes the inventory
    if (intersectObject === "") {
        clearTimeout(inventoryTimeout);
        inventoryPopup.classList.add("inventory-hidden");
        return;
    }

    if (jumpObjects.includes(intersectObject)) {
        jumpObject(intersectObject);
        playSound("fruit", 0.8);

        addToInventory(intersectObject);
    } else {
        // Close inventory when opening another interaction
        clearTimeout(inventoryTimeout);
        inventoryPopup.classList.add("inventory-hidden");

        playSound("open", 0.4);
    }

    showModal(intersectObject);
}
// function findInteractiveObjectName(object) {
//     let currentObject = object;

//     while (currentObject) {
//         if (intersectObjectsNames.includes(currentObject.name)) {
//             return currentObject.name;
//         }

//         currentObject = currentObject.parent;
//     }

//     return "";
// }

function findInteractiveObjectName(object) {
    let currentObject = object;

    while (currentObject) {
        // Check the library text before checking its café parents
        if (
            currentObject.name
                .toLowerCase()
                .includes("text031")
        ) {
            return "House_Low_Poly";
        }

        if (
            intersectObjectsNames.includes(
                currentObject.name
            )
        ) {
            return currentObject.name;
        }

        currentObject = currentObject.parent;
    }

    return "";
}


let namePopupTimeout = null;

function showNamePopup() {
    const popup = document.querySelector(".name-popup");

    popup.classList.add("visible");

    clearTimeout(namePopupTimeout);

    namePopupTimeout = setTimeout(() => {
        popup.classList.remove("visible");
    }, 2500);
}

function knockOverName(predictedBearBox) {
    if (!nameMesh || nameKnockedOver) return;

    const touchedName = nameTriggers.some((box) =>
        predictedBearBox.intersectsBox(box)
    );

    if (!touchedName) return;

    nameKnockedOver = true;
    playSound("fall", 0.4);
    showNamePopup();

    // Keep its current world position if it was inside a pivot/group
    scene.attach(nameMesh);

    const startPosition = nameMesh.position.clone();
    const startQuaternion = nameMesh.quaternion.clone();

    const groundY = 0;

    // Rotate 90 degrees around the text's LOCAL X-axis
    const flatRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -Math.PI / 2
    );

    const finalQuaternion = startQuaternion
        .clone()
        .multiply(flatRotation);

    const rotationProgress = { value: 0 };

    gsap.timeline()

        // Simple explosion upward and sideways
        .to(nameMesh.position, {
            x: startPosition.x + 5,
            y: startPosition.y + 4,
            z: startPosition.z - 3,
            duration: 0.45,
            ease: "power3.out"
        }, 0)

        // Turn it flat without excessive spinning
        .to(rotationProgress, {
            value: 1,
            duration: 0.65,
            ease: "power2.out",

            onUpdate: () => {
                nameMesh.quaternion.slerpQuaternions(
                    startQuaternion,
                    finalQuaternion,
                    rotationProgress.value
                );
            }
        }, 0)

        // Drop it onto the ground
        .to(nameMesh.position, {
            y: groundY,
            duration: 0.55,
            ease: "power2.in"
        }, 0.45)

        // Correct the height after it has rotated
        .call(() => {
            nameMesh.quaternion.copy(finalQuaternion);
            nameMesh.updateMatrixWorld(true);

            const finalBox = new THREE.Box3().setFromObject(nameMesh);

            nameMesh.position.y += groundY - finalBox.min.y;
            nameMesh.updateMatrixWorld(true);
        })

        // Small impact bounce
        .to(nameMesh.position, {
            y: "+=0.12",
            duration: 0.08,
            ease: "power1.out"
        })

        .to(nameMesh.position, {
            y: "-=0.12",
            duration: 0.15,
            ease: "bounce.out"
        });
}

function moveCharacter(targetPosition, targetRotation){
    character.isMoving = true;
    const t1 = gsap.timeline({
        onComplete: ()=>{
            character.isMoving = false;
        }
    })

    t1.to(character.instance.position, {
        x: targetPosition.x,
        z: targetPosition.z,
        duration: character.moveDuration, 
    });

    t1.to(character.instance.rotation, {
        y: targetRotation,
        duration: character.moveDuration, 
    }, 0);


    t1.to(character.instance.position, {
        y: character.instance.position.y + character.jumpHeight,
        duration: character.moveDuration / 2, 
        yoyo: true,
        repeat: 1,
    }, 0);
}
let borderPopupTimeout = null;

function showBorderPopup() {
    const popup = document.querySelector(".border-popup");

    popup.classList.add("visible");

    clearTimeout(borderPopupTimeout);

    borderPopupTimeout = setTimeout(() => {
        popup.classList.remove("visible");
    }, 1800);
}

function onKeyDown(event){
    // if (character.isMoving) return;

    // const targetPosition = new THREE.Vector3().copy(character.instance.position);
    // let targetRotation = 0;
    // switch(event.key.toLowerCase()){
    //     case "w":
    //     case "arrowup":
    //         targetPosition.z += character.moveDistance;
    //         targetRotation = 0 + BEAR_ROTATION_OFFSET;
    //         break
    //     case "s":
    //     case "arrowdown":
    //         targetPosition.z -= character.moveDistance;
    //         targetRotation = Math.PI + BEAR_ROTATION_OFFSET;
    //         break
    //     case "d":
    //     case "arrowright":
    //         targetPosition.x += character.moveDistance;
    //         targetRotation = Math.PI/2 + BEAR_ROTATION_OFFSET;
    //         break
    //     case "a":
    //     case "arrowleft":
    //         targetPosition.x -= character.moveDistance;
    //         targetRotation = -Math.PI/2 + BEAR_ROTATION_OFFSET;
    //         break
    //     default:
    //         return;
    // }
// function onKeyDown(event) {
    if (character.isMoving || !character.instance) return;

    const targetPosition =
        character.instance.position.clone();

    let targetRotation = 0;

    const moveDirection = new THREE.Vector3();

    const cameraForward = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);

    cameraForward.y = 0;
    cameraForward.normalize();
    cameraForward.multiplyScalar(-1);

    const cameraRight = new THREE.Vector3()
        .crossVectors(
            new THREE.Vector3(0, 1, 0),
            cameraForward
        )
        .normalize();

    switch (event.key.toLowerCase()) {
        case "s":
        case "arrowdown":
            moveDirection.copy(cameraForward);
            break;

        case "w":
        case "arrowup":
            moveDirection.copy(cameraForward).negate();
            break;

        case "d":
        case "arrowright":
            moveDirection.copy(cameraRight);
            break;

        case "a":
        case "arrowleft":
            moveDirection.copy(cameraRight).negate();
            break;

        default:
            return;
    }

    targetPosition.addScaledVector(
        moveDirection,
        character.moveDistance
    );

    targetRotation = Math.atan2(
        moveDirection.x,
        moveDirection.z
    );

    const outsideMap =
    targetPosition.x < MAP_BOUNDS.minX ||
    targetPosition.x > MAP_BOUNDS.maxX ||
    targetPosition.z < MAP_BOUNDS.minZ ||
    targetPosition.z > MAP_BOUNDS.maxZ;

    if (outsideMap) {
        showBorderPopup();
        return;
    }

    const bearBox = new THREE.Box3().setFromCenterAndSize(
        character.instance.position.clone(),
        new THREE.Vector3(1.2, 1.5, 1.2)
    );

    const movement = new THREE.Vector3(
        targetPosition.x - character.instance.position.x,
        0,
        targetPosition.z - character.instance.position.z
    );

    const predictedBearBox = bearBox.clone();
    predictedBearBox.translate(movement);

    knockOverName(predictedBearBox);

    let blocked = false;

    for (const box of colliders) {
        if (predictedBearBox.intersectsBox(box)) {
            blocked = true;
            break;
        }
    }

    if (!blocked) {
        moveCharacter(targetPosition, targetRotation);
    }
    // moveCharacter(targetPosition, targetRotation);

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
const mobileControlButtons =
    document.querySelectorAll(".mobile-control");

mobileControlButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();

        button.classList.add("pressed");

        onKeyDown({
            key: button.dataset.key
        });
    });

    button.addEventListener("pointerup", () => {
        button.classList.remove("pressed");
    });

    button.addEventListener("pointercancel", () => {
        button.classList.remove("pressed");
    });

    button.addEventListener("pointerleave", () => {
        button.classList.remove("pressed");
    });
});

const backpackButton =
    document.getElementById("backpack-button");

const inventoryPopup =
    document.getElementById("inventory-popup");

if (backpackButton && inventoryPopup) {
    backpackButton.addEventListener("click", (event) => {
        event.stopPropagation();

        clearTimeout(inventoryTimeout);

        inventoryPopup.classList.toggle("inventory-hidden");
        
        menuPopup?.classList.add("menu-hidden");
        menuButton?.classList.remove("open");
        menuButton?.setAttribute("aria-expanded", "false");
    });

    inventoryPopup.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        clearTimeout(inventoryTimeout);
        inventoryPopup.classList.add("inventory-hidden");
    });
} else {
    console.error(
        "Inventory HTML is missing. Check #backpack-button and #inventory-popup."
    );
}
// fruit
modalProjectDescription.addEventListener(
    "click",
    (event) => {
        const sellButton =
            event.target.closest(".sell-fruit-button");

        if (!sellButton) return;

        const fruit = sellButton.dataset.fruit;
        const amount = sellButton.dataset.amount;

        sellFruit(fruit, amount);
    }
);

//menu
const menuButton =
    document.getElementById("menu-button");

const menuPopup =
    document.getElementById("menu-popup");

if (menuButton && menuPopup) {
    menuButton.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpening =
            menuPopup.classList.contains("menu-hidden");

        menuPopup.classList.toggle("menu-hidden");
        menuButton.classList.toggle("open", isOpening);

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpening)
        );

        // Close backpack when opening menu
        inventoryPopup?.classList.add("inventory-hidden");
    });

    menuPopup.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        menuPopup.classList.add("menu-hidden");
        menuButton.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
    });
}

// cafe
modalProjectDescription.addEventListener(
    "click",
    (event) => {
        const sellButton =
            event.target.closest(".sell-fruit-button");

        if (sellButton) {
            const fruit = sellButton.dataset.fruit;
            const amount = sellButton.dataset.amount;

            sellFruit(fruit, amount);
            return;
        }

        const buyDrinkButton =
            event.target.closest("#buy-drink-button");

        if (buyDrinkButton) {
            buyCafeDrink();
        }
    }
);

const behindTheScenesButton =
    document.querySelector(".menu-reference-button");

if (behindTheScenesButton) {
    behindTheScenesButton.addEventListener("click", () => {
        modalTitle.textContent = "Behind the Scenes";

        modalProjectDescription.innerHTML = `
            <div class="behind-the-scenes">

                <section class="project-overview">
                    <p>
                        This interactive portfolio was built using
                        <strong>Three.js, JavaScript, HTML, CSS, and Blender</strong>.
                        I designed it as an explorable game where visitors can explore my projects and collect food that can be sold at shops.
                    </p>

                    <a
                        class="behind-scenes-github"
                        href="https://github.com/KhadeejaAbbas/portfolio"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View the source code on GitHub ↗
                    </a>
                </section>


                <section class="credits-section">
                    <h2>Development and Inspiration</h2>

                    <div class="credit-card">
                        <h3>Three.js Portfolio Tutorial</h3>
                        <p>
                            I heavily followed this tutorial while learning how to
                            build an interactive Three.js portfolio.
                        </p>
                        <a
                            href="https://youtu.be/yhtdkuw9mbM?si=5VrCdhPGkMJFlX7w"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Watch the tutorial ↗
                        </a>
                    </div>

                    <div class="credit-card">
                        <h3>Character Tutorial</h3>
                        <p>
                            My bear character was designed and modelled by me,
                            based on the techniques demonstrated in this cat
                            character tutorial.
                        </p>
                        <a
                            href="https://youtu.be/FwkPW5LEGs8?si=yigy_hRxmT0--Mwk"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Watch the tutorial ↗
                        </a>
                    </div>

                    <div class="credit-card">
                        <h3>Blender Basics and First Tree</h3>
                        <p>
                            I used this tutorial to learn the basics of Blender and
                            create my first low-poly tree. I kept the original tree
                            in the portfolio scene.
                        </p>
                        <a
                            href="https://youtu.be/dCN_GINRXBo?si=HFD_GuEtyvHFg1zK"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Watch the tutorial ↗
                        </a>
                    </div>

                    <div class="credit-card">
                        <h3>Bruno Simon's Portfolio</h3>
                        <p>
                            The idea of turning my portfolio into an explorable
                            interactive world was heavily inspired by Bruno Simon's
                            portfolio.
                        </p>
                        <a
                            href="https://bruno-simon.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit Bruno Simon's portfolio ↗
                        </a>
                    </div>
                </section>


                <section class="credits-section">
                    <h2>Original Models</h2>

                    <div class="credit-card">
                        <h3>Bear Character</h3>
                        <p>
                            The bear was modelled and coloured by me in Blender,
                            using a low-poly character tutorial as a starting point.
                        </p>

                        <div class="colour-palette">
                            <span>
                                <i style="background:#B76935"></i>
                                Body: #B76935
                            </span>

                            <span>
                                <i style="background:#FFEDD8"></i>
                                Tummy and ears: #FFEDD8
                            </span>

                            <span>
                                <i style="background:#2B2D42"></i>
                                Eyes and nose: #2B2D42
                            </span>

                            <span>
                                <i style="background:#F4ACB7"></i>
                                Cheeks: #F4ACB7
                            </span>
                        </div>
                    </div>

                    <div class="credit-card">
                        <h3>Solar Car Model</h3>
                        <p>
                            The solar car model was created by
                            <strong>Shourya Baranwal</strong> and provided to me
                            for use in this portfolio.
                        </p>
                    </div>

                    <div class="credit-card">
                        <h3>First Low-Poly Tree</h3>
                        <p>
                            One of the trees in the scene was modelled by me while
                            learning Blender.
                        </p>
                    </div>
                </section>


                <section class="credits-section">
                    <h2>Music and Sound</h2>

                    <div class="credit-card">
                        <h3>Background Music</h3>
                        <p>
                            The background music was created by
                            <strong>Kounine</strong>. I discovered the music through
                            Bruno Simon's portfolio, where it was identified as
                            available for use.
                        </p>
                        <a
                            href="https://linktr.ee/Kounine"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit Kounine's page ↗
                        </a>
                    </div>

                    <div class="credit-card">
                        <h3>Sound Effects</h3>
                        <p>
                            Sound effects used throughout the portfolio were sourced
                            from Pixabay's sound-effect library.
                        </p>
                        <a
                            href="https://pixabay.com/sound-effects/search/walking%20in%20water/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View Pixabay sound effects ↗
                        </a>
                    </div>
                </section>


                <section class="credits-section">
                    <h2>BlenderKit Models and Materials</h2>

                    <p class="section-intro">
                        The following third-party assets were imported from
                        BlenderKit and modified or arranged as part of the portfolio
                        environment.
                    </p>

                    <div class="asset-grid">

                        <a href="https://www.blenderkit.com/get-blenderkit/615ea9a9-e3f8-4668-a601-548701d5e334/" target="_blank" rel="noopener noreferrer">
                            Grass
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/2783acf7-1ae5-4398-ba60-dc715dec7344/" target="_blank" rel="noopener noreferrer">
                            Bench
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/6761a317-5b1b-4651-a5b1-204e552df4e9/" target="_blank" rel="noopener noreferrer">
                            Açai Place
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/6e8c6844-fc2e-4c4c-b57e-28588f7b80cc/" target="_blank" rel="noopener noreferrer">
                            Tomato Crate
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/0b317b54-29cf-4f89-8e5d-7ccb89f84984/" target="_blank" rel="noopener noreferrer">
                            Mangoes
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/bd105765-4a45-44a1-9f7d-0a6acba12b3b/" target="_blank" rel="noopener noreferrer">
                            Tulips
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/99d09643-dd06-4063-b4a5-f82a4aada40b/" target="_blank" rel="noopener noreferrer">
                            Scattered Dark Grass
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/5915be01-2645-42d3-bc54-82f927a7de28/" target="_blank" rel="noopener noreferrer">
                            Hospital
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/cd695f32-2299-4733-9d97-b0fd7636d5ee/" target="_blank" rel="noopener noreferrer">
                            Log
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/db6d8cd9-35fb-4a71-a59a-cd569042afd6/" target="_blank" rel="noopener noreferrer">
                            Apples
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/c4a812e6-47c0-46ca-9a19-d9e15b08f355/" target="_blank" rel="noopener noreferrer">
                            Computer
                        </a>

                        <a href="https://www.blenderkit.com/asset-gallery-detail/988376d0-b115-4634-956f-706cf4a39ba8/" target="_blank" rel="noopener noreferrer">
                            Water Material
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/1d4fc216-8d4c-410a-84b1-286303618ae9/" target="_blank" rel="noopener noreferrer">
                            Shop
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/418af5af-2558-4bbd-b2f9-a801500be97b/" target="_blank" rel="noopener noreferrer">
                            Pizzeria
                        </a>

                        <a href="https://www.blenderkit.com/asset-gallery-detail/32dbab59-dc85-4440-ac79-d3d10532b1e1/" target="_blank" rel="noopener noreferrer">
                            Cupcake Shop
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/d9974aa4-51fe-4883-8936-de44995b0a24/" target="_blank" rel="noopener noreferrer">
                            Path
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/ed421fb2-d83d-4ba4-9c03-5e37f1b1a13c/" target="_blank" rel="noopener noreferrer">
                            Road
                        </a>

                        <a href="https://www.blenderkit.com/asset-gallery-detail/d9bb4c54-f406-484f-90e1-78179b301687/" target="_blank" rel="noopener noreferrer">
                            Grass Material
                        </a>

                        <a href="https://www.blenderkit.com/asset-gallery-detail/74989769-6621-4742-83e5-beedad9bf831/" target="_blank" rel="noopener noreferrer">
                            Coffee Shop
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/5f12de32-ffa3-48aa-87b1-e46fa3a65352/" target="_blank" rel="noopener noreferrer">
                            Desert House
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/3874b113-4162-41c5-8646-746452b84d08/" target="_blank" rel="noopener noreferrer">
                            Sign Wood
                        </a>

                        <a href="https://www.blenderkit.com/get-blenderkit/d6f9e897-2206-4f0f-a024-be86f2118a38/" target="_blank" rel="noopener noreferrer">
                            Café Table and Chairs
                        </a>

                        <a href="https://www.blenderkit.com/asset-gallery-detail/346d99d8-36fb-4f9d-a4a1-2f9ad9233e79/" target="_blank" rel="noopener noreferrer">
                            Low-Poly Tree
                        </a>

                    </div>
                </section>


                <section class="credits-section">
                    <h2>Libraries and Design Resources</h2>

                    <div class="asset-grid">

                        <a
                            href="https://gsap.com/docs/v3/Installation/?tab=cdn&module=esm&require=false"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GSAP
                        </a>

                        <a
                            href="https://dev.to/lensco825/how-to-quickly-add-a-loading-screen-onto-your-website-7ga"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Loading-Screen Guide
                        </a>

                        <a
                            href="https://css-loaders.com/nature/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            CSS Loaders
                        </a>

                        <a
                            href="https://fonts.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Google Fonts
                        </a>

                        <a
                            href="https://www.vecteezy.com/vector-art/67183328-a-bold-black-and-white-silhouette-illustration-of-a-ripe-apple-with-stem-and-leaves-perfect-for-design-projects"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Apple Silhouette
                        </a>

                    </div>
                </section>


                <section class="credits-section">
                    <h2>Performance Optimization</h2>

                    <p>
                        The original Blender scene contained approximately
                        <strong>32 million faces</strong>. I reduced it to
                        approximately <strong>300,000 triangles and faces</strong> by:
                    </p>

                    <ul class="optimization-list">
                        <li>
                            Removing individual grass objects and replacing them
                            with a grass material.
                        </li>

                        <li>
                            Applying Blender's Decimate modifier to models with
                            especially high polygon counts.
                        </li>

                        <li>
                            Replacing several high-polygon trees with low-poly
                            alternatives.
                        </li>

                        <li>
                            Further reducing the polygon count of imported
                            low-poly trees using the Decimate modifier.
                        </li>

                        <li>
                            Replacing high-polygon buildings.
                        </li>
                    </ul>
                </section>


                <section class="credits-section">
                    <h2>Game Concept</h2>

                    <p>
                        Visitors can explore the world, discover my projects, and
                        collect apples, mangoes, and tomatoes. A future version may
                        allow the player to sell collected food at the shop and earn
                        in-game money.
                    </p>
                </section>

            </div>
        `;

        // Behind the Scenes uses the larger project-modal layout.
        modal.classList.add("case-study-modal");

        // This page does not use the modal's normal View Project button.
        modalVisitProjectButton.classList.add("hidden");

        modal.classList.remove("hidden");

        // Close the hamburger menu after selecting the page.
        menuPopup.classList.add("menu-hidden");
        menuButton.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");

        playSound("open", 0.4);
    });
}

const desiredCameraPosition = new THREE.Vector3();
const desiredCameraTarget = new THREE.Vector3();
const bearScreenPosition = new THREE.Vector3();
const snapCameraPosition = new THREE.Vector3();

const SNAP_SCREEN_LIMIT = 0.6;

const CAMERA_RADIUS = 0.7;
const cameraCollisionSize = new THREE.Vector3(
    CAMERA_RADIUS * 2,
    CAMERA_RADIUS * 2,
    CAMERA_RADIUS * 2
);

function resolveCameraCollisions(position) {
    const correctedPosition = position.clone();

    // Run more than once in case two buildings overlap
    for (let iteration = 0; iteration < 4; iteration++) {
        let collisionFound = false;

        for (const collider of colliders) {
            // Expand the building box by the camera radius
            const expandedBox = collider.clone().expandByScalar(CAMERA_RADIUS);

            if (!expandedBox.containsPoint(correctedPosition)) {
                continue;
            }

            collisionFound = true;

            // Distance from camera to every side of the box
            const distanceToMinX =
                correctedPosition.x - expandedBox.min.x;

            const distanceToMaxX =
                expandedBox.max.x - correctedPosition.x;

            const distanceToMinY =
                correctedPosition.y - expandedBox.min.y;

            const distanceToMaxY =
                expandedBox.max.y - correctedPosition.y;

            const distanceToMinZ =
                correctedPosition.z - expandedBox.min.z;

            const distanceToMaxZ =
                expandedBox.max.z - correctedPosition.z;

            const smallestDistance = Math.min(
                distanceToMinX,
                distanceToMaxX,
                distanceToMinY,
                distanceToMaxY,
                distanceToMinZ,
                distanceToMaxZ
            );

            const padding = 0.05;

            // Push the camera out through the nearest side
            if (smallestDistance === distanceToMinX) {
                correctedPosition.x =
                    expandedBox.min.x - padding;
            } else if (smallestDistance === distanceToMaxX) {
                correctedPosition.x =
                    expandedBox.max.x + padding;
            } else if (smallestDistance === distanceToMinY) {
                correctedPosition.y =
                    expandedBox.min.y - padding;
            } else if (smallestDistance === distanceToMaxY) {
                correctedPosition.y =
                    expandedBox.max.y + padding;
            } else if (smallestDistance === distanceToMinZ) {
                correctedPosition.z =
                    expandedBox.min.z - padding;
            } else {
                correctedPosition.z =
                    expandedBox.max.z + padding;
            }
        }

        if (!collisionFound) {
            break;
        }
    }

    return correctedPosition;
}

const clock = new THREE.Clock();

function animate() {
    // updateWaterSound();

    raycaster.setFromCamera(pointer, camera);
    const elapsedTime = clock.getElapsedTime();
    
    if (character.instance) {
        desiredCameraPosition.set(
            character.instance.position.x + cameraOffset.x,
            character.instance.position.y + cameraOffset.y,
            character.instance.position.z + cameraOffset.z
        );

        // Convert the bear's world position into screen coordinates
        bearScreenPosition.copy(character.instance.position);
        bearScreenPosition.y += 1;
        bearScreenPosition.project(camera);

        const bearOutOfView =
            bearScreenPosition.x < -SNAP_SCREEN_LIMIT ||
            bearScreenPosition.x > SNAP_SCREEN_LIMIT ||
            bearScreenPosition.y < -SNAP_SCREEN_LIMIT ||
            bearScreenPosition.y > SNAP_SCREEN_LIMIT ||
            bearScreenPosition.z < -1 ||
            bearScreenPosition.z > 1;

        if (bearOutOfView) {
            // Immediately move the camera back to its intended position
            snapCameraPosition.copy(desiredCameraPosition);

            // Keep the snapped position outside building colliders
            const safeSnapPosition =
                resolveCameraCollisions(snapCameraPosition);

            camera.position.copy(safeSnapPosition);

            controls.target.set(
                character.instance.position.x,
                character.instance.position.y + 0.5,
                character.instance.position.z
            );

            // Apply the new camera direction immediately
            controls.update();

        } else {
            // Normal smooth camera following
            const nextCameraPosition = camera.position.clone().lerp(
                desiredCameraPosition,
                0.06
            );

            const safeCameraPosition =
                resolveCameraCollisions(nextCameraPosition);

            camera.position.copy(safeCameraPosition);

            desiredCameraTarget.set(
                character.instance.position.x,
                character.instance.position.y + 0.5,
                character.instance.position.z
            );

            controls.target.lerp(desiredCameraTarget, 0.1);
        }
    }
    // leaves
    for (const leaf of fallingLeaves) {
        leaf.position.y -= leaf.userData.fallSpeed;

        // Wind moving the leaves sideways
        leaf.position.x += leaf.userData.windSpeed;

        // Gentle drifting
        leaf.position.z +=
            Math.sin(
                elapsedTime * 1.5 +
                leaf.userData.phase
            ) * 0.006;

        // Fluttering
        leaf.rotation.x += leaf.userData.rotationSpeed;
        leaf.rotation.y += leaf.userData.rotationSpeed * 0.7;
        leaf.rotation.z +=
            Math.sin(
                elapsedTime * 2 +
                leaf.userData.phase
            ) * 0.01;

        if (character.instance) {
            // Put fallen leaves back above the bear's surrounding area
            if (leaf.position.y < 0.1) {
                leaf.position.set(
                    character.instance.position.x +
                        Math.random() * LEAF_AREA * 2 -
                        LEAF_AREA,

                    7 + Math.random() * 8,

                    character.instance.position.z +
                        Math.random() * LEAF_AREA * 2 -
                        LEAF_AREA
                );
            }

            // Wrap leaves pushed too far by the wind
            if (
                leaf.position.x >
                character.instance.position.x + LEAF_AREA
            ) {
                leaf.position.x =
                    character.instance.position.x - LEAF_AREA;
            }

            // Recycle leaves that are far behind the bear
            if (
                Math.abs(
                    leaf.position.z -
                    character.instance.position.z
                ) > LEAF_AREA
            ) {
                leaf.position.z =
                    character.instance.position.z +
                    Math.random() * LEAF_AREA * 2 -
                    LEAF_AREA;
            }
        }
    }
    //clouds
    for (const cloud of clouds) {
        cloud.position.x += cloud.userData.speed;

        if (cloud.position.x > 60) {
            cloud.position.x = -60;
        }
    }

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


