
import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import "../style.css";
import { supabase } from "./supabase.js";

const container = document.querySelector("#game-container");
const playerId = sessionStorage.getItem("playerId") || crypto.randomUUID();
sessionStorage.setItem("playerId", playerId);

const playerName =
  localStorage.getItem("playerName") ||
  prompt("Oyunda hangi isimle görünmek istiyorsun?") ||
  "Arıcı";

localStorage.setItem("playerName", playerName);

const worldChannel = supabase.channel("apiary-world", {
  config: {
    presence: {
      key: playerId,
    },
  },
});

worldChannel.on("presence", { event: "sync" }, () => {
  const players = worldChannel.presenceState();

  console.log("Çevrimiçi oyuncular:", players);
  console.log("Oyuncu sayısı:", Object.keys(players).length);

  renderRemotePlayers(players);
});

worldChannel.subscribe((status, err) => {
  console.log("Supabase durumu:", status);
  if (err) console.error("Supabase ayrıntılı hata:", err);

  if (status === "SUBSCRIBED") {

worldChannel.track({
  playerId,
  playerName,
  joinedAt: Date.now(),
}).then((result) => {
  console.log("Gönderilen oyuncu bilgisi:", {
    playerId,
    playerName,
    result,
  });
});

    console.log("Çevrimiçi dünyaya bağlandın!");
  }

  if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
    console.error("Çevrimiçi dünyaya bağlanılamadı:", status, err);
  }
});
const loading = document.querySelector("#loading-message");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#b9d5d8");
scene.fog = new THREE.Fog("#b9d5d8", 18, 45);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 8, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.left = "0";
labelRenderer.domElement.style.pointerEvents = "none";
labelRenderer.domElement.style.zIndex = "2";
container.appendChild(labelRenderer.domElement);
scene.add(new THREE.HemisphereLight("#e6f4ff", "#795239", 2));

const sunlight = new THREE.DirectionalLight("#fff0d0", 2.2);
sunlight.position.set(-5, 10, 6);
scene.add(sunlight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshLambertMaterial({ color: "#805634" })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
scene.add(ground);

function addBox(width, height, depth, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

const remoteHives = new Map();
const remoteBees = new Map();
const neighborSpots = [
  [4, 3],
  [-4, 3],
  [4, -3],
  [-4, -3],
  [0, 5],
  [0, -5],
];

function createRemoteHive(playerName) {
  const hiveGroup = new THREE.Group();

  function addHivePart(width, height, depth, color, x, y, z) {
    const part = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshLambertMaterial({ color })
    );

    part.position.set(x, y, z);
    hiveGroup.add(part);
  }

  // Kovan gövdesi ve çatısı
  addHivePart(2.2, 1.9, 1.8, "#bd8b50", 0, 0.95, 0);
  addHivePart(2.35, 0.18, 1.95, "#70452b", 0, 1.98, 0);

  // Tek giriş deliği
  const entrance = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 20),
    new THREE.MeshBasicMaterial({ color: "#302219" })
  );
  entrance.position.set(0, 0.9, 0.906);
  hiveGroup.add(entrance);

  // Kovan ayakları
  addHivePart(0.18, 0.25, 0.18, "#65422b", -0.72, 0.12, 0.55);
  addHivePart(0.18, 0.25, 0.18, "#65422b", 0.72, 0.12, 0.55);
  addHivePart(0.18, 0.25, 0.18, "#65422b", -0.72, 0.12, -0.55);
  addHivePart(0.18, 0.25, 0.18, "#65422b", 0.72, 0.12, -0.55);

  const nameElement = document.createElement("div");
  nameElement.textContent = playerName || "Arıcı";
  nameElement.style.cssText = `
    color: white;
    background: rgba(60, 40, 20, 0.85);
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 13px;
    white-space: nowrap;
  `;

  const nameLabel = new CSS2DObject(nameElement);
  console.log("Kovan etiketi oluşturuldu:", playerName, nameElement);
  nameLabel.position.set(0, 2.8, 0);
  hiveGroup.add(nameLabel);

  scene.add(hiveGroup);
  return hiveGroup;
}

function createRemoteBees() {
  const playerBees = [];

  for (let i = 0; i < 5; i++) {
    const bee = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshLambertMaterial({ color: "#edbd35" })
    );
    body.scale.set(1.25, 0.85, 0.85);
    bee.add(body);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.19, 0.19),
      new THREE.MeshLambertMaterial({ color: "#382b20" })
    );
    stripe.position.x = 0.03;
    bee.add(stripe);

    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 6),
        new THREE.MeshLambertMaterial({
          color: "#eff4e7",
          transparent: true,
          opacity: 0.8
        })
      );

      wing.position.set(-0.02, 0.12, side * 0.12);
      wing.scale.set(0.7, 0.25, 1.2);
      bee.add(wing);
    }

    scene.add(bee);

    playerBees.push({
      mesh: bee,
      phase: (Math.PI * 2 * i) / 5,
      speed: 0.7 + Math.random() * 0.3,
      radius: 1.2 + Math.random() * 0.8
    });
  }

  return playerBees;
}

function renderRemotePlayers(players) {
  const remoteIds = Object.keys(players)
    .filter((id) => id !== playerId)
    .sort();

  const onlineIds = new Set(remoteIds);


  // Ayrılan oyuncuların kovanlarını ve arılarını kaldır
  for (const [id, hive] of remoteHives) {
    if (!onlineIds.has(id)) {
      scene.remove(hive);
      hive.traverse((child) => {
  if (child instanceof CSS2DObject) {
    child.element.remove();
  }
});
      remoteHives.delete(id);

      const playerBees = remoteBees.get(id);

      if (playerBees) {
        playerBees.forEach((bee) => scene.remove(bee.mesh));
        remoteBees.delete(id);
      }
    }
  }


 
  remoteIds.forEach((id, index) => {
    const playerData = players[id]?.[0];
    console.log("Diğer oyuncunun verisi:", id, playerData);
    const playerName = playerData?.playerName || "Arıcı";

    if (!remoteHives.has(id)) {
      remoteHives.set(id, createRemoteHive(playerName));
    }

    const hive = remoteHives.get(id);

    // Kovanın üzerindeki ismi her güncellemede yenile
    const nameLabel = hive.children.find(
      (child) => child instanceof CSS2DObject
    );

    if (nameLabel) {
      nameLabel.element.textContent = playerName;
    }

    const [x, z] = neighborSpots[index % neighborSpots.length];
    hive.position.set(x, 0, z);
    if (!remoteBees.has(id)) {
  remoteBees.set(id, createRemoteBees());
}
  });

}

// Kovan: tek kutu ve tek giriş deliği
addBox(2.2, 1.9, 1.8, "#bd8b50", 0, 0.95, 0);
addBox(2.35, 0.18, 1.95, "#70452b", 0, 1.98, 0);

const entrance = new THREE.Mesh(
  new THREE.CircleGeometry(0.16, 20),
  new THREE.MeshBasicMaterial({ color: "#302219" })
);
entrance.position.set(0, 0.9, 0.906);
scene.add(entrance);

// Kovanın altındaki ayaklar
addBox(0.18, 0.25, 0.18, "#65422b", -0.72, 0.12, 0.55);
addBox(0.18, 0.25, 0.18, "#65422b", 0.72, 0.12, 0.55);
addBox(0.18, 0.25, 0.18, "#65422b", -0.72, 0.12, -0.55);
addBox(0.18, 0.25, 0.18, "#65422b", 0.72, 0.12, -0.55);

const flowerColors = ["#e8d45b", "#e58ba9", "#a9a1e8", "#fff0df"];
const flowers = [];

for (let i = 0; i < 38; i++) {
  const x = (Math.random() - 0.5) * 20;
  const z = (Math.random() - 0.5) * 16;

  if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;

  const flower = new THREE.Group();
  flower.position.set(x, 0, z);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.42, 5),
    new THREE.MeshLambertMaterial({ color: "#4b783c" })
  );
  stem.position.y = 0.21;
  flower.add(stem);

  const petals = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshLambertMaterial({
      color: flowerColors[i % flowerColors.length]
    })
  );
  petals.position.y = 0.45;
  petals.scale.set(1, 0.65, 1);
  flower.add(petals);

  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 6),
    new THREE.MeshLambertMaterial({ color: "#754421" })
  );
  center.position.y = 0.49;
  flower.add(center);

  scene.add(flower);
  flowers.push(flower);
}

// Basit ot kümeleri
for (let i = 0; i < 65; i++) {
  const x = (Math.random() - 0.5) * 24;
  const z = (Math.random() - 0.5) * 18;

  const grass = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.38, 4),
    new THREE.MeshLambertMaterial({ color: "#668347" })
  );
  grass.position.set(x, 0.16, z);
  grass.rotation.z = (Math.random() - 0.5) * 0.6;
  scene.add(grass);
}

// Beş basit arı
const bees = [];

for (let i = 0; i < 5; i++) {
  const bee = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 8),
    new THREE.MeshLambertMaterial({ color: "#edbd35" })
  );
  body.scale.set(1.25, 0.85, 0.85);
  bee.add(body);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.19, 0.19),
    new THREE.MeshLambertMaterial({ color: "#382b20" })
  );
  stripe.position.x = 0.03;
  bee.add(stripe);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshLambertMaterial({
        color: "#eff4e7",
        transparent: true,
        opacity: 0.8
      })
    );
    wing.position.set(-0.02, 0.12, side * 0.12);
    wing.scale.set(0.7, 0.25, 1.2);
    bee.add(wing);
  }

  bee.position.set(0, 1.2 + i * 0.15, 1.2);
  scene.add(bee);

  bees.push({
    mesh: bee,
    flowerIndex: i % flowers.length,
    phase: Math.random() * Math.PI * 2,
    speed: 0.45 + Math.random() * 0.2
  });
}

const beeNames = ["Pamuk", "Boncuk", "Balım", "Pıtırcık", "Sarı"];
const beeLabels = bees.map((bee, index) => {
  const element = document.createElement("div");

  element.textContent = beeNames[index];
  element.style.background = "rgba(45, 32, 22, 0.85)";
  element.style.color = "#fff0ce";
  element.style.padding = "3px 7px";
  element.style.borderRadius = "6px";
  element.style.fontSize = "12px";
  element.style.fontWeight = "bold";
  element.style.whiteSpace = "nowrap";

  const label = new CSS2DObject(element);
  label.position.set(0, 0.4, 0);
  bee.mesh.add(label);

  return element;
});
const beeList = document.querySelector("#bee-list");

function renderBeeList() {
  beeList.innerHTML = "";

  beeNames.forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "bee-item";

    const icon = document.createElement("span");
    icon.textContent = "🐝";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 20;
    input.value = name;
    input.setAttribute("aria-label", `${index + 1}. arının adı`);

    input.addEventListener("change", () => {
      beeNames[index] = input.value.trim() || `Arı ${index + 1}`;
      input.value = beeNames[index];
      beeLabels[index].textContent = beeNames[index];
    });

    row.append(icon, input);
    beeList.appendChild(row);
  });

  document.querySelector("#bee-count").textContent = `${bees.length} arı`;
}

renderBeeList();

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
}

window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
let honey = 0;
let lastHoneyTime = 0;
function animate() {
    const currentTime = clock.getElapsedTime();

  if (currentTime - lastHoneyTime >= 10) {
    honey += 1;
    lastHoneyTime = currentTime;

    document.getElementById("honey-counter").textContent =
      `🍯 ${honey} g bal`;
  }
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  bees.forEach((bee) => {
    const flower = flowers[bee.flowerIndex];
    const cycle = (time * bee.speed + bee.phase) % 10;

    let targetX;
    let targetZ;

    if (cycle < 2) {
      targetX = 0;
      targetZ = 1.1;
    } else if (cycle < 4) {
      targetX = flower.position.x;
      targetZ = flower.position.z;
    } else if (cycle < 6) {
      targetX = flower.position.x;
      targetZ = flower.position.z;
    } else {
      targetX = 0;
      targetZ = 1.1;
    }

    const targetY = cycle >= 2 && cycle < 6 ? 0.7 : 1.15;
    const mesh = bee.mesh;

    mesh.position.x += (targetX - mesh.position.x) * 0.025;
    mesh.position.z += (targetZ - mesh.position.z) * 0.025;
    mesh.position.y +=
      (targetY + Math.sin(time * 7 + bee.phase) * 0.12 - mesh.position.y) *
      0.06;

    mesh.rotation.z = Math.sin(time * 4 + bee.phase) * 0.12;
  });


  // Komşu oyuncuların arıları: kovandan çiçeğe, sonra kovana
  remoteBees.forEach((playerBees, playerId) => {
    const hive = remoteHives.get(playerId);
    if (!hive) return;

    playerBees.forEach((bee, i) => {
      const flower = flowers[(i + 1) % flowers.length];
      const cycle = (time * bee.speed + bee.phase) % 10;

      let targetX;
      let targetZ;

      if (cycle < 2) {
        // Kovandan çıkış
        targetX = hive.position.x;
        targetZ = hive.position.z + 1.1;
      } else if (cycle < 4) {
        // Çiçeğe uçuş
        targetX = flower.position.x;
        targetZ = flower.position.z;
      } else if (cycle < 6) {
        // Çiçekte bekleme
        targetX = flower.position.x;
        targetZ = flower.position.z;
      } else {
        // Kovandaki girişe dönüş
        targetX = hive.position.x;
        targetZ = hive.position.z + 1.1;
      }

      const targetY = cycle >= 2 && cycle < 6 ? 0.7 : 1.15;

      bee.mesh.position.x +=
        (targetX - bee.mesh.position.x) * 0.025;

      bee.mesh.position.z +=
        (targetZ - bee.mesh.position.z) * 0.025;

      bee.mesh.position.y +=
        (targetY + Math.sin(time * 7 + bee.phase) * 0.12 -
          bee.mesh.position.y) * 0.06;

      bee.mesh.rotation.z = Math.sin(time * 4 + bee.phase) * 0.12;
    });
  });


  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();
loading?.remove();
