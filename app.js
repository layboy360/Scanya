document.addEventListener("DOMContentLoaded", function () {

  console.log("Scanya iniciado");

  /* =========================
     GOOGLE
  ========================= */

  const GOOGLE_CLIENT_ID = 337441010397-j6c8equuhipa5tif7umvrnfr6v258jrr.apps.googleusercontent.com;

  let googleAccessToken = null;
  let tokenClient = null;


  /* =========================
     ELEMENTOS
  ========================= */

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

  const connectDriveBtn = document.getElementById("connectDriveBtn");
  const driveStatus = document.getElementById("driveStatus");
  const driveCard = document.querySelector(".drive-card");

  let currentImage = "";
  let selectedCategory = "Inventario";


  /* =========================
     FECHA
  ========================= */

  function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  if (dateInput) {
    dateInput.value = getToday();
  }


  /* =========================
     NAVEGACIÓN
  ========================= */

  function showPage(pageId) {

    pages.forEach(function (page) {
      page.classList.remove("active");
    });

    const target = document.getElementById(pageId);

    if (target) {
      target.classList.add("active");
    }

    navButtons.forEach(function (button) {

      if (button.dataset.page === pageId) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }

    });

    window.scrollTo(0, 0);
  }


  pageButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      const pageId = button.dataset.page;

      if (pageId) {
        showPage(pageId);
      }

    });

  });


  /* =========================
     CÁMARA
  ========================= */

  if (openScanner) {

    openScanner.addEventListener("click", function () {

      if (camera) {
        camera.click();
      }

    });

  }


  if (takeAnotherPhoto) {

    takeAnotherPhoto.addEventListener("click", function () {

      if (camera) {
        camera.click();
      }

    });

  }


  if (camera) {

    camera.addEventListener("change", function () {

      const file = camera.files[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = function (event) {

        currentImage = event.target.result;

        if (preview) {

          preview.src = currentImage;
          preview.style.display = "block";

        }

        if (previewPlaceholder) {
          previewPlaceholder.style.display = "none";
        }

        showPage("scannerPage");

      };

      reader.readAsDataURL(file);

    });

  }


  /* =========================
     CATEGORÍAS
  ========================= */

  document
    .querySelectorAll(".category")
    .forEach(function (button) {

      button.addEventListener("click", function () {

        document
          .querySelectorAll(".category")
          .forEach(function (item) {

            item.classList.remove("selected");

          });

        button.classList.add("selected");

        selectedCategory =
          button.dataset.category || "Otros";

      });

    });


  /* =========================
     LOCAL STORAGE
  ========================= */

  function getReceipts() {

    try {

      return JSON.parse(
        localStorage.getItem("scanyaReceipts")
      ) || [];

    } catch (error) {

      console.error(error);

      return [];

    }

  }


  function saveReceipts(receipts) {

    localStorage.setItem(
      "scanyaReceipts",
      JSON.stringify(receipts)
    );

  }


  /* =========================
     DINERO
  ========================= */

  function money(value) {

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(value);

  }


  /* =========================
     TARJETA RECIBO
  ========================= */

  function receiptCard(receipt) {

    return `

      <div class="receipt-card">

        ${
          receipt.image
          ?
          `
          <img
            class="receipt-thumb"
            src="${receipt.image}"
            alt="Recibo"
          >
          `
          :
          `
          <div class="receipt-thumb"></div>
          `
        }

        <div class="receipt-info">

          <strong>
            ${receipt.merchant}
          </strong>

          <div class="receipt-meta">
            ${receipt.date} · ${receipt.category}
          </div>

        </div>

        <div class="receipt-amount">
          ${money(receipt.total)}
        </div>

      </div>

    `;

  }


  /* =========================
     ACTUALIZAR INICIO
  ========================= */

  function updateHome(receipts) {

    const now = new Date();

    const monthlyReceipts =
      receipts.filter(function (receipt) {

        const date =
          new Date(receipt.date + "T12:00:00");

        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );

      });


    const total =
      monthlyReceipts.reduce(
        function (sum, receipt) {

          return sum + Number(receipt.total);

        },
        0
      );


    const monthTotal =
      document.getElementById("monthTotal");

    const receiptCount =
      document.getElementById("receiptCount");

    const currentMonth =
      document.getElementById("currentMonth");

    const recentReceipts =
      document.getElementById("recentReceipts");


    if (monthTotal) {
      monthTotal.textContent = money(total);
    }

    if (receiptCount) {

      receiptCount.textContent =
        monthlyReceipts.length + " recibos";

    }

    if (currentMonth) {

      currentMonth.textContent =
        now.toLocaleDateString(
          "es-US",
          {
            month: "long"
          }
        );

    }


    if (!recentReceipts) {
      return;
    }


    if (receipts.length === 0) {

      recentReceipts.innerHTML = `

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


    recentReceipts.innerHTML =
      receipts
        .slice(0, 4)
        .map(receiptCard)
        .join("");

  }


  /* =========================
     RECIBOS
  ========================= */

  function updateReceipts(receipts) {

    const container =
      document.getElementById("allReceipts");

    if (!container) {
      return;
    }


    if (receipts.length === 0) {

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


  /* =========================
     GASTOS
  ========================= */

  function updateExpenses(receipts) {

    const total =
      receipts.reduce(
        function (sum, receipt) {

          return sum + Number(receipt.total);

        },
        0
      );


    const totalElement =
      document.getElementById("allTimeTotal");

    if (totalElement) {
      totalElement.textContent = money(total);
    }


    const categories = {};


    receipts.forEach(function (receipt) {

      const category =
        receipt.category || "Otros";

      categories[category] =
        (categories[category] || 0)
        +
        Number(receipt.total);

    });


    const container =
      document.getElementById("categorySummary");

    if (!container) {
      return;
    }


    if (Object.keys(categories).length === 0) {

      container.innerHTML = `

        <div class="empty-state">
          No hay gastos registrados.
        </div>

      `;

      return;
    }


    container.innerHTML =
      Object.entries(categories)

        .sort(function (a, b) {
          return b[1] - a[1];
        })

        .map(function (entry) {

          return `

            <div class="summary-row">

              <span>
                ${entry[0]}
              </span>

              <strong>
                ${money(entry[1])}
              </strong>

            </div>

          `;

        })

        .join("");

  }


  /* =========================
     REPORTES
  ========================= */

  function updateReports(receipts) {

    const now = new Date();


    const monthly =
      receipts.filter(function (receipt) {

        const date =
          new Date(receipt.date + "T12:00:00");

        return (
          date.getMonth() === now.getMonth()
          &&
          date.getFullYear() === now.getFullYear()
        );

      });


    const monthlyTotal =
      monthly.reduce(
        function (sum, receipt) {

          return sum + Number(receipt.total);

        },
        0
      );


    const reportTotal =
      document.getElementById("reportMonthTotal");

    if (reportTotal) {
      reportTotal.textContent = money(monthlyTotal);
    }


    const merchants = {};

    receipts.forEach(function (receipt) {

      merchants[receipt.merchant] =
        (merchants[receipt.merchant] || 0)
        +
        Number(receipt.total);

    });


    const merchantEntries =
      Object.entries(merchants)
        .sort(function (a, b) {
          return b[1] - a[1];
        });


    const topMerchant =
      document.getElementById("topMerchant");

    if (topMerchant) {

      topMerchant.textContent =
        merchantEntries.length
          ? merchantEntries[0][0]
          : "—";

    }


    const categories = {};

    receipts.forEach(function (receipt) {

      const category =
        receipt.category || "Otros";

      categories[category] =
        (categories[category] || 0)
        +
        Number(receipt.total);

    });


    const categoryEntries =
      Object.entries(categories)
        .sort(function (a, b) {
          return b[1] - a[1];
        });


    const topCategory =
      document.getElementById("topCategory");

    if (topCategory) {

      topCategory.textContent =
        categoryEntries.length
          ? categoryEntries[0][0]
          : "—";

    }

  }


  /* =========================
     ACTUALIZAR TODO
  ========================= */

  function updateUI() {

    const receipts =
      getReceipts();

    updateHome(receipts);
    updateReceipts(receipts);
    updateExpenses(receipts);
    updateReports(receipts);

  }


  /* =========================
     GUARDAR RECIBO
  ========================= */

  const saveReceiptButton =
    document.getElementById("saveReceipt");


  if (saveReceiptButton) {

    saveReceiptButton.addEventListener(
      "click",
      function () {

        const merchant =
          merchantInput.value.trim();

        const total =
          Number(totalInput.value);

        const date =
          dateInput.value;

        const note =
          noteInput.value.trim();


        if (!merchant) {

          alert(
            "Escribe el nombre del comercio."
          );

          return;
        }


        if (!total || total <= 0) {

          alert(
            "Escribe el total del recibo."
          );

          return;
        }


        const receipt = {

          id: Date.now(),

          merchant: merchant,

          total: total,

          date: date,

          category: selectedCategory,

          note: note,

          image: currentImage

        };


        const receipts =
          getReceipts();


        receipts.unshift(receipt);


        try {

          saveReceipts(receipts);

        } catch (error) {

          console.error(error);

          alert(
            "No se pudo guardar localmente."
          );

          return;

        }


        merchantInput.value = "";
        totalInput.value = "";
        noteInput.value = "";
        dateInput.value = getToday();

        currentImage = "";

        if (camera) {
          camera.value = "";
        }

        if (preview) {
          preview.src = "";
          preview.style.display = "none";
        }

        if (previewPlaceholder) {
          previewPlaceholder.style.display = "block";
        }


        updateUI();

        showPage("homePage");

        alert(
          "Recibo guardado ✅"
        );

      }
    );

  }


  /* =========================
     BUSCADOR
  ========================= */

  const searchInput =
    document.getElementById("receiptSearch");


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        const search =
          searchInput.value
            .toLowerCase()
            .trim();


        const receipts =
          getReceipts().filter(
            function (receipt) {

              return receipt.merchant
                .toLowerCase()
                .includes(search);

            }
          );


        updateReceipts(receipts);

      }
    );

  }


  /* =========================
     GOOGLE DRIVE
     IMPORTANTE:
     si Google falla, Scanya sigue funcionando
  ========================= */

  function initializeGoogle() {

    try {

      if (
        typeof google === "undefined"
        ||
        !google.accounts
        ||
        !google.accounts.oauth2
      ) {

        console.log(
          "Google todavía no está listo"
        );

        return;

      }


      if (
        !GOOGLE_CLIENT_ID
        ||
        GOOGLE_CLIENT_ID ===
          "PEGA_AQUI_TU_CLIENT_ID"
      ) {

        console.warn(
          "Falta el Google Client ID"
        );

        return;

      }


      tokenClient =
        google.accounts.oauth2.initTokenClient({

          client_id:
            GOOGLE_CLIENT_ID,

          scope:
            "https://www.googleapis.com/auth/drive.file",

          callback:
            function (response) {

              if (
                response.error
              ) {

                console.error(response);

                alert(
                  "Google no pudo conectarse."
                );

                return;
              }


              googleAccessToken =
                response.access_token;


              if (driveStatus) {
                driveStatus.textContent =
                  "Conectado";
              }


              if (connectDriveBtn) {

                connectDriveBtn.textContent =
                  "Conectado ✓";

              }


              if (driveCard) {

                driveCard.classList.add(
                  "connected"
                );

              }

            }

        });


      console.log(
        "Google Drive listo"
      );

    } catch (error) {

      console.error(
        "Error de Google:",
        error
      );

    }

  }


  if (connectDriveBtn) {

    connectDriveBtn.addEventListener(
      "click",
      function () {

        if (!tokenClient) {

          initializeGoogle();

        }


        if (!tokenClient) {

          alert(
            "Google Drive todavía no está disponible. La app seguirá funcionando normalmente."
          );

          return;

        }


        try {

          tokenClient.requestAccessToken({
            prompt: "consent"
          });

        } catch (error) {

          console.error(error);

          alert(
            "No se pudo abrir Google."
          );

        }

      }
    );

  }


  setTimeout(
    initializeGoogle,
    1500
  );


  /* =========================
     ARRANCAR SCANYA
  ========================= */

  updateUI();

});
