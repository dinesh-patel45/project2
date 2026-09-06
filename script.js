// ============================================================
// Config
// ============================================================
// When deployed on Vercel, replace the production URL with your Render backend URL.
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
const API_BASE = isLocal ? "http://127.0.0.1:8000" : "https://your-render-backend-url.onrender.com";

// (sklearn sorts classes_ alphabetically: Entire home/apt, Private room, Shared room)
const ROOM_TYPES = ["Entire home/apt", "Private room", "Shared room"];

// Borough accent colors — mirrors the CSS custom properties in style.css
const BOROUGHS = {
  "Bronx":         { color: "#e2703c" },
  "Brooklyn":      { color: "#3e8f6f" },
  "Manhattan":     { color: "#e3b23c" },
  "Queens":        { color: "#4c7ea8" },
  "Staten Island": { color: "#9b6ba8" },
};

// Neighbourhood -> borough, grouped by borough (from the trained encoder's vocabulary)
const NEIGHBOURHOODS_BY_BOROUGH = {
  "Bronx": ["Allerton","Baychester","Belmont","Bronxdale","Castle Hill","City Island","Claremont Village","Clason Point","Co-op City","Concourse","Concourse Village","East Morrisania","Eastchester","Edenwald","Fieldston","Fordham","Highbridge","Hunts Point","Kingsbridge","Longwood","Melrose","Morris Heights","Morris Park","Morrisania","Mott Haven","Mount Eden","Mount Hope","North Riverdale","Norwood","Olinville","Parkchester","Pelham Bay","Pelham Gardens","Port Morris","Riverdale","Schuylerville","Soundview","Spuyten Duyvil","Throgs Neck","Tremont","Unionport","University Heights","Van Nest","Wakefield","West Farms","Westchester Square","Williamsbridge","Woodlawn"],
  "Brooklyn": ["Bath Beach","Bay Ridge","Bedford-Stuyvesant","Bensonhurst","Bergen Beach","Boerum Hill","Borough Park","Brighton Beach","Brooklyn Heights","Brownsville","Bushwick","Canarsie","Carroll Gardens","Clinton Hill","Cobble Hill","Columbia St","Coney Island","Crown Heights","Cypress Hills","DUMBO","Downtown Brooklyn","Dyker Heights","East Flatbush","East New York","Flatbush","Flatlands","Fort Greene","Fort Hamilton","Gowanus","Gravesend","Greenpoint","Kensington","Manhattan Beach","Midwood","Mill Basin","Navy Yard","Park Slope","Prospect Heights","Prospect-Lefferts Gardens","Red Hook","Sea Gate","Sheepshead Bay","South Slope","Sunset Park","Vinegar Hill","Williamsburg","Windsor Terrace"],
  "Manhattan": ["Battery Park City","Chelsea","Chinatown","Civic Center","East Harlem","East Village","Financial District","Flatiron District","Gramercy","Greenwich Village","Harlem","Hell's Kitchen","Inwood","Kips Bay","Little Italy","Lower East Side","Marble Hill","Midtown","Morningside Heights","Murray Hill","NoHo","Nolita","Roosevelt Island","SoHo","Stuyvesant Town","Theater District","Tribeca","Two Bridges","Upper East Side","Upper West Side","Washington Heights","West Village"],
  "Queens": ["Arverne","Astoria","Bay Terrace","Bayside","Bayswater","Belle Harbor","Bellerose","Breezy Point","Briarwood","Cambria Heights","College Point","Corona","Ditmars Steinway","Douglaston","East Elmhurst","Edgemere","Elmhurst","Far Rockaway","Flushing","Forest Hills","Fresh Meadows","Glendale","Hollis","Holliswood","Howard Beach","Jackson Heights","Jamaica","Jamaica Estates","Jamaica Hills","Kew Gardens","Kew Gardens Hills","Laurelton","Little Neck","Long Island City","Maspeth","Middle Village","Neponsit","Ozone Park","Queens Village","Rego Park","Richmond Hill","Ridgewood","Rockaway Beach","Rosedale","South Ozone Park","Springfield Gardens","St. Albans","Sunnyside","Whitestone","Woodhaven","Woodside"],
  "Staten Island": ["Arden Heights","Arrochar","Bay Terrace, Staten Island","Bull's Head","Castleton Corners","Clifton","Concord","Dongan Hills","Eltingville","Emerson Hill","Graniteville","Grant City","Great Kills","Grymes Hill","Howland Hook","Huguenot","Mariners Harbor","Midland Beach","New Brighton","New Dorp","New Dorp Beach","New Springville","Oakwood","Port Richmond","Prince's Bay","Randall Manor","Rosebank","Rossville","Shore Acres","Silver Lake","South Beach","St. George","Stapleton","Todt Hill","Tompkinsville","Tottenville","West Brighton","Westerleigh","Willowbrook"],
};

const EXAMPLE_LISTINGS = [
  { borough: "Manhattan", neighbourhood: "Hell's Kitchen", latitude: 40.7638, longitude: -73.9918, price: 210, minimum_nights: 2, number_of_reviews: 87, reviews_per_month: 2.4, calculated_host_listings_count: 1, availability_365: 240 },
  { borough: "Brooklyn", neighbourhood: "Bushwick", latitude: 40.6958, longitude: -73.9171, price: 65, minimum_nights: 30, number_of_reviews: 12, reviews_per_month: 0.6, calculated_host_listings_count: 4, availability_365: 90 },
  { borough: "Queens", neighbourhood: "Astoria", latitude: 40.7643, longitude: -73.9235, price: 45, minimum_nights: 1, number_of_reviews: 210, reviews_per_month: 5.1, calculated_host_listings_count: 1, availability_365: 310 },
];

// ============================================================
// Elements
// ============================================================
const root = document.documentElement;
const form = document.getElementById("predictForm");
const boroughChips = document.getElementById("boroughChips");
const neighbourhoodInput = document.getElementById("neighbourhood");
const neighbourhoodList = document.getElementById("neighbourhoodList");
const availabilityInput = document.getElementById("availability_365");
const availabilityOut = document.getElementById("availabilityOut");
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");
const fillExampleBtn = document.getElementById("fillExample");

const tagCard = document.getElementById("tagCard");
const resultType = document.getElementById("resultType");
const resultLocation = document.getElementById("resultLocation");
const tagBars = document.getElementById("tagBars");

const apiStatus = document.getElementById("apiStatus");
const apiLabel = apiStatus.querySelector(".api-label");

let selectedBorough = "Manhattan";

// ============================================================
// Build borough chips
// ============================================================
function buildBoroughChips() {
  boroughChips.innerHTML = "";
  Object.entries(BOROUGHS).forEach(([name, meta], i) => {
    const id = `borough-${name.replace(/\s+/g, "-").toLowerCase()}`;

    const wrap = document.createElement("div");
    wrap.className = "chip";
    wrap.style.setProperty("--chip-color", meta.color);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "neighbourhood_group";
    input.id = id;
    input.value = name;
    input.checked = name === selectedBorough;

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = name;

    input.addEventListener("change", () => {
      selectedBorough = name;
      root.setAttribute("data-borough", name);
      populateNeighbourhoods(name);
    });

    wrap.appendChild(input);
    wrap.appendChild(label);
    boroughChips.appendChild(wrap);
  });

  root.setAttribute("data-borough", selectedBorough);
}

function populateNeighbourhoods(borough) {
  neighbourhoodList.innerHTML = "";
  const list = NEIGHBOURHOODS_BY_BOROUGH[borough] || [];
  list.forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    neighbourhoodList.appendChild(opt);
  });
  // clear a stale value from a previous borough
  if (!list.includes(neighbourhoodInput.value)) {
    neighbourhoodInput.value = "";
  }
}

// ============================================================
// Range output sync
// ============================================================
availabilityInput.addEventListener("input", () => {
  availabilityOut.textContent = availabilityInput.value;
});

// ============================================================
// Example listing
// ============================================================
fillExampleBtn.addEventListener("click", () => {
  const ex = EXAMPLE_LISTINGS[Math.floor(Math.random() * EXAMPLE_LISTINGS.length)];

  selectedBorough = ex.borough;
  const radio = form.querySelector(`input[name="neighbourhood_group"][value="${CSS.escape(ex.borough)}"]`);
  if (radio) radio.checked = true;
  root.setAttribute("data-borough", ex.borough);
  populateNeighbourhoods(ex.borough);

  neighbourhoodInput.value = ex.neighbourhood;
  document.getElementById("latitude").value = ex.latitude;
  document.getElementById("longitude").value = ex.longitude;
  document.getElementById("price").value = ex.price;
  document.getElementById("minimum_nights").value = ex.minimum_nights;
  document.getElementById("number_of_reviews").value = ex.number_of_reviews;
  document.getElementById("reviews_per_month").value = ex.reviews_per_month;
  document.getElementById("calculated_host_listings_count").value = ex.calculated_host_listings_count;
  availabilityInput.value = ex.availability_365;
  availabilityOut.textContent = ex.availability_365;

  formError.textContent = "";
});

// ============================================================
// API status check
// ============================================================
async function checkApiStatus() {
  apiStatus.dataset.state = "checking";
  apiLabel.textContent = "Checking API…";
  try {
    const res = await fetch(`${API_BASE}/`, { method: "GET" });
    if (res.ok) {
      apiStatus.dataset.state = "online";
      apiLabel.textContent = "API online";
    } else {
      throw new Error("bad status");
    }
  } catch (e) {
    apiStatus.dataset.state = "offline";
    apiLabel.textContent = "API offline";
  }
}

// ============================================================
// Submit
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  if (!neighbourhoodInput.value.trim()) {
    formError.textContent = "Pick a neighbourhood from the list.";
    neighbourhoodInput.focus();
    return;
  }

  const payload = {
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    price: parseFloat(document.getElementById("price").value),
    minimum_nights: parseInt(document.getElementById("minimum_nights").value, 10),
    number_of_reviews: parseInt(document.getElementById("number_of_reviews").value, 10),
    reviews_per_month: parseFloat(document.getElementById("reviews_per_month").value),
    calculated_host_listings_count: parseInt(document.getElementById("calculated_host_listings_count").value, 10),
    availability_365: parseInt(availabilityInput.value, 10),
    neighbourhood_group: selectedBorough,
    neighbourhood: neighbourhoodInput.value.trim(),
  };

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await safeErrorDetail(res);
      throw new Error(detail || `Request failed (${res.status})`);
    }

    const data = await res.json();
    apiStatus.dataset.state = "online";
    apiLabel.textContent = "API online";
    renderResult(data, payload);
  } catch (err) {
    if (err instanceof TypeError) {
      formError.textContent = `Can't reach the API at ${API_BASE}. Is main.py running?`;
      apiStatus.dataset.state = "offline";
      apiLabel.textContent = "API offline";
    } else {
      formError.textContent = err.message || "Something went wrong reading that listing.";
    }
  } finally {
    setLoading(false);
  }
});

async function safeErrorDetail(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((d) => d.msg).join(", ");
    }
  } catch (_) {}
  return null;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.innerHTML = isLoading
    ? `<span class="btn-label"><span class="spinner" aria-hidden="true"></span>Reading the listing…</span>`
    : `<span class="btn-label">Call it</span>`;
}

// ============================================================
// Render result onto the "listing tag"
// ============================================================
function renderResult(data, payload) {
  const predicted = data.predicted_room_type;
  const probs = data.probability || [];

  resultType.textContent = predicted;
  resultLocation.textContent = `${payload.neighbourhood}, ${payload.neighbourhood_group}`;

  tagBars.innerHTML = "";
  ROOM_TYPES.forEach((label, i) => {
    const p = probs[i] ?? 0;
    const pct = Math.round(p * 1000) / 10; // one decimal

    const row = document.createElement("div");
    row.className = "tag-bar-row";
    row.dataset.winner = String(label === predicted);

    row.innerHTML = `
      <div class="tag-bar-label"><span>${label}</span><span class="pct">${pct}%</span></div>
      <div class="tag-bar-track"><div class="tag-bar-fill" style="width:0%"></div></div>
    `;
    tagBars.appendChild(row);

    // animate the fill in on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector(".tag-bar-fill").style.width = `${pct}%`;
      });
    });
  });

  tagCard.dataset.state = "result";
  tagCard.classList.remove("just-revealed");
  // eslint-disable-next-line no-unused-expressions
  void tagCard.offsetWidth; // restart animation
  tagCard.classList.add("just-revealed");
}

// ============================================================
// Init
// ============================================================
buildBoroughChips();
populateNeighbourhoods(selectedBorough);
checkApiStatus();
