const airports = [
  "JFK - New York",
  "LAX - Los Angeles",
  "SFO - San Francisco",
  "ORD - Chicago",
  "MIA - Miami",
  "DFW - Dallas/Fort Worth",
  "ATL - Atlanta",
  "LHR - London Heathrow",
  "CDG - Paris Charles de Gaulle",
  "DXB - Dubai",
  "HND - Tokyo Haneda",
  "SIN - Singapore"
];

const form = document.getElementById("bookingForm");
const panes = [...document.querySelectorAll(".step-pane")];
const steps = [...document.querySelectorAll("#steps li")];
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const summaryEl = document.getElementById("summary");
const ticketEl = document.getElementById("ticket");
const seatMap = document.getElementById("seatMap");

const state = { step: 0, seat: "" };

function fillAirportDropdowns() {
  ["fromAirport", "toAirport"].forEach((id) => {
    const select = document.getElementById(id);
    airports.forEach((airport) => {
      const option = document.createElement("option");
      option.value = airport;
      option.textContent = airport;
      select.appendChild(option);
    });
  });
}

function renderSeatMap() {
  const rows = [1, 2, 3, 4, 5, 6];
  const cols = ["A", "B", "C", "D", "E", "F"];
  const occupied = new Set(["1C", "2E", "4A", "5D", "6F"]);

  rows.forEach((row) => {
    cols.forEach((col) => {
      const code = `${row}${col}`;
      const seat = document.createElement("button");
      seat.type = "button";
      seat.className = "seat";
      seat.textContent = code;

      if (row <= 2) seat.classList.add("premium");
      if (occupied.has(code)) {
        seat.classList.add("occupied");
        seat.disabled = true;
      }

      seat.addEventListener("click", () => {
        document.querySelectorAll(".seat.selected").forEach((s) => s.classList.remove("selected"));
        seat.classList.add("selected");
        state.seat = code;
        document.getElementById("seat").value = code;
      });

      seatMap.appendChild(seat);
    });
  });
}

function setStep(idx) {
  state.step = idx;
  panes.forEach((pane, i) => pane.classList.toggle("active", i === idx));
  steps.forEach((step, i) => step.classList.toggle("active", i === idx));
  prevBtn.disabled = idx === 0;
  nextBtn.textContent = idx === panes.length - 1 ? "Start New Booking" : "Continue";
}

function fmtMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function buildSummary() {
  const adults = Number(document.getElementById("adultCount").value || 0);
  const children = Number(document.getElementById("childCount").value || 0);
  const passengers = adults + children;
  const className = document.getElementById("cabinClass").value;

  const base = className === "Business" ? 1150 : className === "Premium Economy" ? 870 : 620;
  const subtotal = base * passengers;
  const seatFee = state.seat ? (state.seat.startsWith("1") || state.seat.startsWith("2") ? 90 : 30) : 0;
  const taxes = subtotal * 0.14;
  const total = subtotal + taxes + seatFee;

  return {
    passengers,
    subtotal,
    taxes,
    seatFee,
    total
  };
}

function renderSummary() {
  const pricing = buildSummary();
  summaryEl.innerHTML = `
    <h4>Trip Summary</h4>
    <dl>
      <dt>Route</dt><dd>${document.getElementById("fromAirport").value} → ${document.getElementById("toAirport").value}</dd>
      <dt>Travel Dates</dt><dd>${document.getElementById("departDate").value} to ${document.getElementById("returnDate").value || "One-way"}</dd>
      <dt>Passenger</dt><dd>${document.getElementById("fullName").value}</dd>
      <dt>Seat</dt><dd>${state.seat || "Not selected"}</dd>
      <dt>Subtotal</dt><dd>${fmtMoney(pricing.subtotal)}</dd>
      <dt>Taxes/Fees</dt><dd>${fmtMoney(pricing.taxes)}</dd>
      <dt>Seat Fee</dt><dd>${fmtMoney(pricing.seatFee)}</dd>
      <dt><strong>Total</strong></dt><dd><strong>${fmtMoney(pricing.total)}</strong></dd>
    </dl>
  `;
}

function renderTicket() {
  const pricing = buildSummary();
  const pnr = `JF${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  ticketEl.innerHTML = `
    <h4>E-ticket Confirmed ✅</h4>
    <p>Your booking is confirmed. Save this reference for check-in.</p>
    <dl>
      <dt>Booking Ref (PNR)</dt><dd>${pnr}</dd>
      <dt>Passenger</dt><dd>${document.getElementById("fullName").value}</dd>
      <dt>Email</dt><dd>${document.getElementById("email").value}</dd>
      <dt>Route</dt><dd>${document.getElementById("fromAirport").value} → ${document.getElementById("toAirport").value}</dd>
      <dt>Departure</dt><dd>${document.getElementById("departDate").value}</dd>
      <dt>Seat</dt><dd>${state.seat}</dd>
      <dt>Amount Paid</dt><dd>${fmtMoney(pricing.total)}</dd>
      <dt>Status</dt><dd>Ticketed</dd>
    </dl>
  `;
}

function validateStep() {
  if (state.step === 0) {
    const from = document.getElementById("fromAirport").value;
    const to = document.getElementById("toAirport").value;
    if (!from || !to || from === to) {
      alert("Please select different departure and destination airports.");
      return false;
    }
    if (!document.getElementById("departDate").value) {
      alert("Please choose a departure date.");
      return false;
    }
  }

  if (state.step === 1) {
    const requiredIds = ["fullName", "email", "phone", "dob", "passport"];
    const ok = requiredIds.every((id) => document.getElementById(id).value.trim() !== "");
    if (!ok) {
      alert("Please complete all traveler information fields.");
      return false;
    }
  }

  if (state.step === 2 && !state.seat) {
    alert("Please choose a seat to continue.");
    return false;
  }

  if (state.step === 4) {
    const requiredIds = ["cardName", "cardNumber", "cardExpiry", "cardCvv", "billingZip"];
    const ok = requiredIds.every((id) => document.getElementById(id).value.trim() !== "");
    if (!ok) {
      alert("Please complete payment details.");
      return false;
    }
  }

  return true;
}

nextBtn.addEventListener("click", () => {
  if (state.step === panes.length - 1) {
    form.reset();
    state.seat = "";
    document.querySelectorAll(".seat.selected").forEach((s) => s.classList.remove("selected"));
    setStep(0);
    return;
  }

  if (!validateStep()) return;

  if (state.step === 2) renderSummary();
  if (state.step === 4) renderTicket();

  setStep(state.step + 1);
});

prevBtn.addEventListener("click", () => {
  if (state.step > 0) setStep(state.step - 1);
});

fillAirportDropdowns();
renderSeatMap();
setStep(0);
