(function () {
  if (document.getElementById("carDetailsModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #carDetailsModal {
      position: fixed;
      top: 70px;
      right: 20px;
      max-width: 480px;
      background: white;
      border: 1px solid #ccc;
      padding: 20px;
      z-index: 9999;
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 10px;
    }
    .modal-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #007bff;
    }
    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
      text-align: right;
      font-size: 14px;
    }
    .modal-grid div {
      background: #f9f9f9;
      padding: 8px;
      border-radius: 6px;
    }
    .close-btn {
      margin-top: 15px;
      background: #dc3545;
      color: white;
      padding: 10px;
      border: none;
      border-radius: 8px;
      width: 100%;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "carDetailsModal";
  modal.style.display = "none";
  modal.innerHTML = `
    <div id="carDetailsTitle" class="modal-title">פרטי רכב</div>
    <div id="carDetailsGrid" class="modal-grid"></div>
    <button onclick="toggleDetails()" class="close-btn">סגור</button>
  `;
  document.body.appendChild(modal);

  window.toggleDetails = function () {
    const modal = document.getElementById("carDetailsModal");
    if (modal.style.display === "none") {
      const raw = sessionStorage.getItem("carData");
      if (!raw) return alert("אין מידע להצגה");

      try {
        const data = JSON.parse(raw);
        const grid = document.getElementById("carDetailsGrid");
        const title = document.getElementById("carDetailsTitle");
        title.innerText = data["כותרת"] || "פרטי רכב";
        grid.innerHTML = "";

        Object.entries(data).forEach(([key, val]) => {
          if (key === "כותרת") return;
          const el = document.createElement("div");
          el.innerHTML = `<strong>${key}:</strong> ${val}`;
          grid.appendChild(el);
        });

        modal.style.display = "block";
      } catch (e) {
        console.error("carData parse error", e);
        alert("שגיאה בפענוח הנתונים");
      }
    } else {
      modal.style.display = "none";
    }
  };
})();
