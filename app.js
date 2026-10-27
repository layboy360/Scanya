document.addEventListener("DOMContentLoaded", function () {

  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll(".nav-button");
  const pageButtons = document.querySelectorAll("[data-page]");

  const camera = document.getElementById("receiptCamera");
  const openScanner = document.getElementById("openScanner");
  const takeAnotherPhoto = document.getElementById("takeAnotherPhoto");

  const preview = document.getElementById("receiptPreview");
  const previewPlaceholder = document.getElementById("previewPlaceholder");

  const merchantInput = document.getElementById("merchant");
  const dateInput = document.getElementById("receiptDate");
  const totalInput = document.getElementById("receiptTotal");
  const noteInput = document.getElementById("receiptNote");

  let selectedCategory = "Inventario";
  let currentImage = "";

  dateInput.value = new Date().toISOString().split("T")[0];

  function showPage(pageId) {
    pages.forEach(page => {
      page.classList.remove("active");
    });

    const target = document.getElementById(pageId);

    if (target) {
      target.classList.add("active");
    }

    navButtons.forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  pageButtons.forEach(button => {
    button.addEventListener("click", function () {
      showPage(button.dataset.page);
    });
  });

  openScanner.addEventListener("click", function () {
    camera.click();
  });

  takeAnotherPhoto.addEventListener("click", function () {
    camera.click();
  });

  camera.addEventListener("change", function () {
    const file = camera.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      currentImage = event.target.result;

      preview.src = currentImage;
      preview.style.display = "block";
      previewPlaceholder.style.display = "none";

      showPage("scannerPage");
    };

    reader.readAsDataURL(file);
  });

  document
    .querySelectorAll(".category")
    .forEach(button => {
      button.addEventListener("click", function () {

        document
          .querySelectorAll(".category")
          .forEach(item => {
            item.classList.remove("selected");
          });

        button.classList.add("selected");
        selectedCategory = button.dataset.category;
      });
    });

  document
    .getElementById("saveReceipt")
    .addEventListener("click", saveReceipt);

  function saveReceipt() {

    const merchant = merchantInput.value.trim();
    const total = Number(totalInput.value);
    const date = dateInput.value;
    const note = noteInput.value.trim();

    if (!merchant) {
      alert("Escribe el nombre del comercio.");
      return;
    }

    if (!total || total <= 0) {
      alert("Escribe el total del recibo.");
      return;
    }

    const receipt = {
      id: Date.now(),
      merchant,
      total,
      date,
      category: selectedCategory,
      note,
      image: currentImage
    };

    const receipts = getReceipts();

    receipts.unshift(receipt);

    localStorage.setItem(
      "scanyaReceipts",
      JSON.stringify(receipts)
    );

    resetForm();
    updateUI();
    showPage("homePage");

    alert("Recibo guardado ✅");
  }

  function getReceipts() {
    try {
      return JSON.parse(
        localStorage.getItem("scanyaReceipts")
      ) || [];
    } catch {
      return [];
    }
  }

  function resetForm() {

    merchantInput.value = "";
    totalInput.value = "";
    noteInput.value = "";

    dateInput.value =
      new Date()
        .toISOString()
        .split("T")[0];

    currentImage = "";

    camera.value = "";

    preview.src = "";
    preview.style.display = "none";
    previewPlaceholder.style.display = "block";
  }

  function money(value) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(value);
  }

  function receiptCard(receipt) {

    const image = receipt.image ? receipt.image : "";

    return `
      <div class="receipt-card">

        ${
          image
            ? `
              <img
                class="receipt-thumb"
                src="${image}"
                alt="Recibo"
              >
            `
            : `
              <div class="receipt-thumb"></div>
            `
        }

        <div class="receipt-info">

          <strong>
            ${receipt.merchant}
          </strong>

          <div class="receipt-meta">
            ${receipt.date}
            ·
            ${receipt.category}
          </div>

        </div>

        <div class="receipt-amount">
          ${money(receipt.total)}
        </div>

      </div>
    `;
  }

  function updateUI() {

    const receipts = getReceipts();

    updateHome(receipts);
    updateReceipts(receipts);
    updateExpenses(receipts);
    updateReports(receipts);
  }

  function updateHome(receipts) {

    const today = new Date();

    const month = today.getMonth();
    const year = today.getFullYear();

    const monthReceipts =
      receipts.filter(receipt => {

        const date =
          new Date(
            receipt.date + "T12:00:00"
          );

        return (
          date.getMonth() === month &&
          date.getFullYear() === year
        );
      });

    const total =
      monthReceipts.reduce(
        (sum, receipt) =>
          sum + receipt.total,
        0
      );

    document
      .getElementById("monthTotal")
      .textContent =
      money(total);

    document
      .getElementById("receiptCount")
      .textContent =
      `${monthReceipts.length} recibos`;

    document
      .getElementById("currentMonth")
      .textContent =
      today.toLocaleDateString(
        "es-US",
        {
          month: "long"
        }
      );

    const recent =
      document.getElementById(
        "recentReceipts"
      );

    if (!receipts.length) {

      recent.innerHTML = `
        <div class="empty-state">

          <div class="empty-icon">
            🧾
          </div>

          <strong>
            Todavía no hay recibos
          </strong>

          <p>
            Escanea tu primer recibo para comenzar.
          </p>

        </div>
      `;

      return;
    }

    recent.innerHTML =
      receipts
        .slice(0, 4)
        .map(receiptCard)
        .join("");
  }

  function updateReceipts(receipts) {

    const container =
      document.getElementById(
        "allReceipts"
      );

    if (!receipts.length) {

      container.innerHTML = `
        <div class="empty-state">
          No hay recibos guardados.
        </div>
      `;

      return;
    }

    container.innerHTML =
      receipts
        .map(receiptCard)
        .join("");
  }

  function updateExpenses(receipts) {

    const total =
      receipts.reduce(
        (sum, receipt) =>
          sum + receipt.total,
        0
      );

    document
      .getElementById("allTimeTotal")
      .textContent =
      money(total);

    const categories = {};

    receipts.forEach(receipt => {

      categories[receipt.category] =
        (categories[receipt.category] || 0)
        +
        receipt.total;
    });

    const container =
      document.getElementById(
        "categorySummary"
      );

    if (!Object.keys(categories).length) {

      container.innerHTML = `
        <div class="empty-state">
          No hay gastos registrados.
        </div>
      `;

      return;
    }

    container.innerHTML =
      Object
        .entries(categories)
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .map(
          ([category, amount]) => `
            <div class="summary-row">

              <span>
                ${category}
              </span>

              <strong>
                ${money(amount)}
              </strong>

            </div>
          `
        )
        .join("");
  }

  function updateReports(receipts) {

    const now = new Date();

    const monthly =
      receipts.filter(receipt => {

        const d =
          new Date(
            receipt.date + "T12:00:00"
          );

        return (
          d.getMonth() === now.getMonth()
          &&
          d.getFullYear() === now.getFullYear()
        );
      });

    const monthlyTotal =
      monthly.reduce(
        (sum, receipt) =>
          sum + receipt.total,
        0
      );

    document
      .getElementById("reportMonthTotal")
      .textContent =
      money(monthlyTotal);

    const merchants = {};

    receipts.forEach(receipt => {

      merchants[receipt.merchant] =
        (merchants[receipt.merchant] || 0)
        +
        receipt.total;
    });

    const topMerchant =
      Object
        .entries(merchants)
        .sort(
          (a, b) =>
            b[1] - a[1]
        )[0];

    document
      .getElementById("topMerchant")
      .textContent =
      topMerchant
        ? topMerchant[0]
        : "—";

    const categories = {};

    receipts.forEach(receipt => {

      categories[receipt.category] =
        (categories[receipt.category] || 0)
        +
        receipt.total;
    });

    const topCategory =
      Object
        .entries(categories)
        .sort(
          (a, b) =>
            b[1] - a[1]
        )[0];

    document
      .getElementById("topCategory")
      .textContent =
      topCategory
        ? topCategory[0]
        : "—";
  }

  document
    .getElementById("receiptSearch")
    .addEventListener(
      "input",
      function () {

        const search =
          this.value
            .toLowerCase()
            .trim();

        const receipts =
          getReceipts()
            .filter(receipt =>
              receipt.merchant
                .toLowerCase()
                .includes(search)
            );

        const container =
          document.getElementById(
            "allReceipts"
          );

        container.innerHTML =
          receipts.length
            ?
            receipts
              .map(receiptCard)
              .join("")
            :
            `
              <div class="empty-state">
                No encontramos recibos.
              </div>
            `;
      }
    );

  updateUI();

});