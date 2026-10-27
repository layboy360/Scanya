document.addEventListener("DOMContentLoaded", function () {

  const GOOGLE_CLIENT_ID =
    "337441010397-j6c8equuhipa5tif7umvrnfr6v258jrr.apps.googleusercontent.com";

  const GOOGLE_SCOPE =
    "https://www.googleapis.com/auth/drive.file";

  const FOLDER_KEY = "scanyaDriveFolderId";

  let googleAccessToken = null;
  let tokenClient = null;
  let currentImage = "";
  let selectedCategory = "Inventario";

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

  const saveReceiptButton = document.getElementById("saveReceipt");

  const connectDriveBtn = document.getElementById("connectDriveBtn");
  const driveStatus = document.getElementById("driveStatus");
  const driveCard = document.querySelector(".drive-card");

  const searchInput = document.getElementById("receiptSearch");


  /* =====================
     UTILIDADES
  ===================== */

  function getToday() {
    const now = new Date();

    const year = now.getFullYear();

    const month =
      String(now.getMonth() + 1).padStart(2, "0");

    const day =
      String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function money(value) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(Number(value) || 0);
  }


  function cleanFileName(text) {
    return String(text)
      .trim()
      .replace(/[^a-z0-9_-]/gi, "_")
      .replace(/_+/g, "_")
      .substring(0, 50);
  }


  function getReceipts() {
    try {
      return JSON.parse(
        localStorage.getItem("scanyaReceipts")
      ) || [];
    } catch (error) {
      return [];
    }
  }


  function saveReceipts(receipts) {
    localStorage.setItem(
      "scanyaReceipts",
      JSON.stringify(receipts)
    );
  }


  if (dateInput) {
    dateInput.value = getToday();
  }


  /* =====================
     NAVEGACIÓN
  ===================== */

  function showPage(pageId) {

    pages.forEach(function (page) {
      page.classList.remove("active");
    });

    const target =
      document.getElementById(pageId);

    if (target) {
      target.classList.add("active");
    }

    navButtons.forEach(function (button) {

      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );

    });

    window.scrollTo(0, 0);
  }


  pageButtons.forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        const pageId =
          button.dataset.page;

        if (pageId) {
          showPage(pageId);
        }

      }
    );

  });


  /* =====================
     CÁMARA
  ===================== */

  if (openScanner && camera) {

    openScanner.addEventListener(
      "click",
      function () {
        camera.click();
      }
    );

  }


  if (takeAnotherPhoto && camera) {

    takeAnotherPhoto.addEventListener(
      "click",
      function () {
        camera.click();
      }
    );

  }


  if (camera) {

    camera.addEventListener(
      "change",
      function () {

        const file =
          camera.files[0];

        if (!file) {
          return;
        }

        const reader =
          new FileReader();

        reader.onload =
          function (event) {

            currentImage =
              event.target.result;

            preview.src =
              currentImage;

            preview.style.display =
              "block";

            previewPlaceholder.style.display =
              "none";

            showPage(
              "scannerPage"
            );

          };

        reader.readAsDataURL(
          file
        );

      }
    );

  }


  /* =====================
     CATEGORÍAS
  ===================== */

  document
    .querySelectorAll(".category")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          document
            .querySelectorAll(".category")
            .forEach(function (item) {
              item.classList.remove("selected");
            });

          button.classList.add("selected");

          selectedCategory =
            button.dataset.category || "Otros";

        }
      );

    });


  /* =====================
     GOOGLE LOGIN
  ===================== */

  function initializeGoogle() {

    if (
      typeof google === "undefined" ||
      !google.accounts ||
      !google.accounts.oauth2
    ) {
      return;
    }

    tokenClient =
      google.accounts.oauth2.initTokenClient({

        client_id:
          GOOGLE_CLIENT_ID,

        scope:
          GOOGLE_SCOPE,

        callback:
          function (response) {

            if (response.error) {

              alert(
                "Error de Google: " +
                response.error
              );

              return;
            }

            googleAccessToken =
              response.access_token;

            driveStatus.textContent =
              "Conectado";

            connectDriveBtn.textContent =
              "Conectado ✓";

            driveCard.classList.add(
              "connected"
            );

          }

      });

  }


  if (connectDriveBtn) {

    connectDriveBtn.addEventListener(
      "click",
      function () {

        if (googleAccessToken) {
          alert(
            "Google Drive ya está conectado."
          );
          return;
        }

        if (!tokenClient) {
          initializeGoogle();
        }

        if (!tokenClient) {

          alert(
            "Google todavía está cargando."
          );

          return;
        }

        tokenClient.requestAccessToken({
          prompt: "consent"
        });

      }
    );

  }


  setTimeout(
    initializeGoogle,
    1000
  );


  /* =====================
     DRIVE - CREAR CARPETA
  ===================== */

  async function createDriveFolder() {

    const response =
      await fetch(
        "https://www.googleapis.com/drive/v3/files?fields=id,name",
        {
          method: "POST",

          headers: {
            Authorization:
              "Bearer " +
              googleAccessToken,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name:
                "Scanya Receipts",

              mimeType:
                "application/vnd.google-apps.folder"
            })
        }
      );


    const text =
      await response.text();


    if (!response.ok) {

      throw new Error(
        "CREAR CARPETA: " +
        text
      );

    }


    const folder =
      JSON.parse(text);


    localStorage.setItem(
      FOLDER_KEY,
      folder.id
    );


    return folder.id;
  }


  async function getDriveFolder() {

    const saved =
      localStorage.getItem(
        FOLDER_KEY
      );


    if (saved) {
      return saved;
    }


    return await createDriveFolder();
  }


  /* =====================
     IMAGEN A BLOB
  ===================== */

  function dataURLtoBlob(dataURL) {

    const parts =
      dataURL.split(",");

    const mimeMatch =
      parts[0].match(
        /:(.*?);/
      );

    const mime =
      mimeMatch
        ? mimeMatch[1]
        : "image/jpeg";


    const binary =
      atob(parts[1]);


    const bytes =
      new Uint8Array(
        binary.length
      );


    for (
      let i = 0;
      i < binary.length;
      i++
    ) {

      bytes[i] =
        binary.charCodeAt(i);

    }


    return new Blob(
      [bytes],
      {
        type: mime
      }
    );
  }


  /* =====================
     SUBIR A DRIVE
  ===================== */

  async function uploadToDrive(data) {

    const folderId =
      await getDriveFolder();


    const imageBlob =
      dataURLtoBlob(
        currentImage
      );


    const extension =
      imageBlob.type.includes("png")
        ? "png"
        : "jpg";


    const fileName =
      cleanFileName(data.date) +
      "_" +
      cleanFileName(data.merchant) +
      "_" +
      Number(data.total).toFixed(2) +
      "_" +
      cleanFileName(data.category) +
      "." +
      extension;


    const metadata = {
      name: fileName,

      parents: [
        folderId
      ],

      description:
        "Scanya Receipt | " +
        "Comercio: " +
        data.merchant +
        " | Total: $" +
        Number(data.total).toFixed(2) +
        " | Categoría: " +
        data.category +
        " | Fecha: " +
        data.date
    };


    const boundary =
      "scanya_" +
      Date.now();


    const body =
      new Blob(
        [
          "--" +
          boundary +
          "\r\n",

          "Content-Type: application/json; charset=UTF-8\r\n\r\n",

          JSON.stringify(
            metadata
          ),

          "\r\n--" +
          boundary +
          "\r\n",

          "Content-Type: " +
          imageBlob.type +
          "\r\n\r\n",

          imageBlob,

          "\r\n--" +
          boundary +
          "--"
        ],
        {
          type:
            "multipart/related; boundary=" +
            boundary
        }
      );


    const response =
      await fetch(

        "https://www.googleapis.com/upload/drive/v3/files" +
        "?uploadType=multipart" +
        "&fields=id,name,webViewLink",

        {
          method: "POST",

          headers: {
            Authorization:
              "Bearer " +
              googleAccessToken,

            "Content-Type":
              "multipart/related; boundary=" +
              boundary
          },

          body: body
        }

      );


    const text =
      await response.text();


    if (!response.ok) {

      throw new Error(
        "SUBIR FOTO: " +
        text
      );

    }


    const file =
      JSON.parse(text);


    return {
      id: file.id,

      name: file.name,

      link:
        file.webViewLink ||
        (
          "https://drive.google.com/file/d/" +
          file.id +
          "/view"
        )
    };
  }


  /* =====================
     GUARDAR RECIBO
  ===================== */

  if (saveReceiptButton) {

    saveReceiptButton.addEventListener(
      "click",
      async function () {

        const merchant =
          merchantInput.value.trim();

        const total =
          Number(
            totalInput.value
          );

        const date =
          dateInput.value ||
          getToday();

        const note =
          noteInput.value.trim();


        if (!merchant) {

          alert(
            "Escribe el comercio."
          );

          return;
        }


        if (!total || total <= 0) {

          alert(
            "Escribe el total."
          );

          return;
        }


        if (!currentImage) {

          alert(
            "Toma una foto del recibo."
          );

          return;
        }


        if (!googleAccessToken) {

          alert(
            "Primero conecta Google Drive."
          );

          showPage(
            "homePage"
          );

          return;
        }


        saveReceiptButton.disabled =
          true;

        saveReceiptButton.textContent =
          "Subiendo a Drive...";


        try {

          const driveFile =
            await uploadToDrive({
              merchant:
                merchant,

              total:
                total,

              date:
                date,

              category:
                selectedCategory
            });


          const receipt = {
            id:
              Date.now(),

            merchant:
              merchant,

            total:
              total,

            date:
              date,

            category:
              selectedCategory,

            note:
              note,

            image:
              currentImage,

            driveFileId:
              driveFile.id,

            driveLink:
              driveFile.link
          };


          const receipts =
            getReceipts();

          receipts.unshift(
            receipt
          );


          try {

            saveReceipts(
              receipts
            );

          } catch (storageError) {

            receipt.image = "";

            saveReceipts(
              receipts
            );

          }


          merchantInput.value = "";
          totalInput.value = "";
          noteInput.value = "";
          dateInput.value = getToday();

          currentImage = "";
          camera.value = "";

          preview.src = "";
          preview.style.display = "none";

          previewPlaceholder.style.display =
            "block";


          updateUI();

          showPage(
            "homePage"
          );


          alert(
            "Recibo guardado en Google Drive ✅"
          );

        } catch (error) {

          console.error(error);

          /*
            AHORA MOSTRAMOS EL ERROR REAL
          */

          alert(
            "ERROR GOOGLE DRIVE:\n\n" +
            error.message
          );

        } finally {

          saveReceiptButton.disabled =
            false;

          saveReceiptButton.textContent =
            "Guardar recibo";

        }

      }
    );

  }


  /* =====================
     TARJETAS / REPORTES
  ===================== */

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
            >
            `
            :
            `<div class="receipt-thumb"></div>`
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


  function updateHome(receipts) {

    const now =
      new Date();


    const monthly =
      receipts.filter(
        function (receipt) {

          const date =
            new Date(
              receipt.date +
              "T12:00:00"
            );

          return (
            date.getMonth() ===
              now.getMonth()
            &&
            date.getFullYear() ===
              now.getFullYear()
          );

        }
      );


    const total =
      monthly.reduce(
        function (sum, receipt) {

          return (
            sum +
            Number(receipt.total)
          );

        },
        0
      );


    document.getElementById(
      "monthTotal"
    ).textContent =
      money(total);


    document.getElementById(
      "receiptCount"
    ).textContent =
      monthly.length +
      " recibos";


    document.getElementById(
      "currentMonth"
    ).textContent =
      now.toLocaleDateString(
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
        function (sum, receipt) {

          return (
            sum +
            Number(receipt.total)
          );

        },
        0
      );


    document.getElementById(
      "allTimeTotal"
    ).textContent =
      money(total);


    const categories = {};


    receipts.forEach(
      function (receipt) {

        const category =
          receipt.category || "Otros";

        categories[category] =
          (
            categories[category] || 0
          ) +
          Number(receipt.total);

      }
    );


    const container =
      document.getElementById(
        "categorySummary"
      );


    if (
      !Object.keys(categories).length
    ) {

      container.innerHTML = `
        <div class="empty-state">
          No hay gastos registrados.
        </div>
      `;

      return;
    }


    container.innerHTML =
      Object.entries(categories)
        .sort(
          function (a, b) {
            return b[1] - a[1];
          }
        )
        .map(
          function (entry) {

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

          }
        )
        .join("");
  }


  function updateReports(receipts) {

    const now =
      new Date();


    const monthly =
      receipts.filter(
        function (receipt) {

          const date =
            new Date(
              receipt.date +
              "T12:00:00"
            );

          return (
            date.getMonth() ===
              now.getMonth()
            &&
            date.getFullYear() ===
              now.getFullYear()
          );

        }
      );


    const monthlyTotal =
      monthly.reduce(
        function (sum, receipt) {

          return (
            sum +
            Number(receipt.total)
          );

        },
        0
      );


    document.getElementById(
      "reportMonthTotal"
    ).textContent =
      money(monthlyTotal);


    const merchants = {};
    const categories = {};


    receipts.forEach(
      function (receipt) {

        merchants[receipt.merchant] =
          (
            merchants[receipt.merchant] || 0
          ) +
          Number(receipt.total);


        const category =
          receipt.category || "Otros";

        categories[category] =
          (
            categories[category] || 0
          ) +
          Number(receipt.total);

      }
    );


    const merchantEntries =
      Object.entries(merchants)
        .sort(
          function (a, b) {
            return b[1] - a[1];
          }
        );


    const categoryEntries =
      Object.entries(categories)
        .sort(
          function (a, b) {
            return b[1] - a[1];
          }
        );


    document.getElementById(
      "topMerchant"
    ).textContent =
      merchantEntries.length
        ? merchantEntries[0][0]
        : "—";


    document.getElementById(
      "topCategory"
    ).textContent =
      categoryEntries.length
        ? categoryEntries[0][0]
        : "—";
  }


  function updateUI() {

    const receipts =
      getReceipts();

    updateHome(receipts);
    updateReceipts(receipts);
    updateExpenses(receipts);
    updateReports(receipts);
  }


  /* =====================
     BÚSQUEDA
  ===================== */

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        const search =
          searchInput.value
            .toLowerCase()
            .trim();


        const receipts =
          getReceipts()
            .filter(
              function (receipt) {

                return (
                  receipt.merchant ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    search
                  );

              }
            );


        updateReceipts(
          receipts
        );

      }
    );

  }


  updateUI();

});
