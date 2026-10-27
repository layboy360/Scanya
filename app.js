document.addEventListener("DOMContentLoaded", function () {

  /* ==========================================
     CONFIGURACIÓN GOOGLE
     ========================================== */

  const GOOGLE_CLIENT_ID = 337441010397-j6c8equuhipa5tif7umvrnfr6v258jrr.apps.googleusercontent.com;

  const DRIVE_SCOPE =
    "https://www.googleapis.com/auth/drive.file";

  const DRIVE_FOLDER_ID =
    "1U6MlebqbmhnExo4crDaG9Ro98IZQz7Np";


  let googleAccessToken = null;
  let tokenClient = null;


  /* ==========================================
     ELEMENTOS DE SCANYA
     ========================================== */

  const pages =
    document.querySelectorAll(".page");

  const navButtons =
    document.querySelectorAll(".nav-button");

  const pageButtons =
    document.querySelectorAll("[data-page]");


  const camera =
    document.getElementById("receiptCamera");

  const openScanner =
    document.getElementById("openScanner");

  const takeAnotherPhoto =
    document.getElementById("takeAnotherPhoto");


  const preview =
    document.getElementById("receiptPreview");

  const previewPlaceholder =
    document.getElementById("previewPlaceholder");


  const merchantInput =
    document.getElementById("merchant");

  const dateInput =
    document.getElementById("receiptDate");

  const totalInput =
    document.getElementById("receiptTotal");

  const noteInput =
    document.getElementById("receiptNote");


  const connectDriveBtn =
    document.getElementById("connectDriveBtn");

  const driveStatus =
    document.getElementById("driveStatus");

  const driveCard =
    document.querySelector(".drive-card");


  let selectedCategory =
    "Inventario";

  let currentImage =
    "";


  dateInput.value =
    getToday();


  /* ==========================================
     GOOGLE DRIVE
     ========================================== */

  function initializeGoogle() {

    if (
      typeof google === "undefined" ||
      !google.accounts
    ) {

      setTimeout(
        initializeGoogle,
        500
      );

      return;

    }


    tokenClient =
      google.accounts.oauth2.initTokenClient({

        client_id:
          GOOGLE_CLIENT_ID,

        scope:
          DRIVE_SCOPE,

        callback:
          function (response) {

            if (response.error) {

              console.error(
                response
              );

              alert(
                "No se pudo conectar con Google Drive."
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


  connectDriveBtn.addEventListener(
    "click",
    function () {

      if (!tokenClient) {

        alert(
          "Google todavía está cargando. Intenta nuevamente."
        );

        return;

      }


      if (googleAccessToken) {

        alert(
          "Google Drive ya está conectado."
        );

        return;

      }


      tokenClient.requestAccessToken({
        prompt: "consent"
      });

    }
  );


  initializeGoogle();


  /* ==========================================
     NAVEGACIÓN
     ========================================== */

  function showPage(pageId) {

    pages.forEach(
      function (page) {

        page.classList.remove(
          "active"
        );

      }
    );


    const target =
      document.getElementById(
        pageId
      );


    if (target) {

      target.classList.add(
        "active"
      );

    }


    navButtons.forEach(
      function (button) {

        button.classList.toggle(
          "active",
          button.dataset.page === pageId
        );

      }
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  pageButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          showPage(
            button.dataset.page
          );

        }
      );

    }
  );


  /* ==========================================
     CÁMARA
     ========================================== */

  openScanner.addEventListener(
    "click",
    function () {

      camera.click();

    }
  );


  takeAnotherPhoto.addEventListener(
    "click",
    function () {

      camera.click();

    }
  );


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


  /* ==========================================
     CATEGORÍAS
     ========================================== */

  document
    .querySelectorAll(".category")
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            document
              .querySelectorAll(".category")
              .forEach(
                function (item) {

                  item.classList.remove(
                    "selected"
                  );

                }
              );


            button.classList.add(
              "selected"
            );


            selectedCategory =
              button.dataset.category;

          }
        );

      }
    );


  /* ==========================================
     GUARDAR RECIBO
     ========================================== */

  document
    .getElementById("saveReceipt")
    .addEventListener(
      "click",
      saveReceipt
    );


  async function saveReceipt() {

    const merchant =
      merchantInput.value.trim();


    const total =
      Number(
        totalInput.value
      );


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


    if (
      !total ||
      total <= 0
    ) {

      alert(
        "Escribe el total del recibo."
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


    const saveButton =
      document.getElementById(
        "saveReceipt"
      );


    saveButton.disabled =
      true;


    saveButton.textContent =
      "Guardando en Drive...";


    try {

      const driveFile =
        await uploadReceiptToDrive({

          merchant,
          total,
          date,
          category:
            selectedCategory

        });


      const receipt = {

        id:
          Date.now(),

        merchant,

        total,

        date,

        category:
          selectedCategory,

        note,

        image:
          currentImage,

        driveFileId:
          driveFile.id,

        driveLink:
          driveFile.webViewLink || ""

      };


      const receipts =
        getReceipts();


      receipts.unshift(
        receipt
      );


      try {

        localStorage.setItem(
          "scanyaReceipts",
          JSON.stringify(
            receipts
          )
        );

      }

      catch (error) {

        console.warn(
          "No se pudo guardar la imagen completa localmente.",
          error
        );


        receipt.image =
          "";


        localStorage.setItem(
          "scanyaReceipts",
          JSON.stringify(
            receipts
          )
        );

      }


      resetForm();

      updateUI();

      showPage(
        "homePage"
      );


      alert(
        "Recibo guardado en Google Drive ✅"
      );

    }

    catch (error) {

      console.error(
        error
      );


      alert(
        "Hubo un problema guardando el recibo en Google Drive."
      );

    }

    finally {

      saveButton.disabled =
        false;


      saveButton.textContent =
        "Guardar recibo";

    }

  }


  /* ==========================================
     SUBIR FOTO A GOOGLE DRIVE
     ========================================== */

  async function uploadReceiptToDrive(data) {

    const imageBlob =
      dataURLtoBlob(
        currentImage
      );


    const extension =
      imageBlob.type.includes(
        "png"
      )
        ? "png"
        : "jpg";


    const cleanMerchant =
      sanitizeFileName(
        data.merchant
      );


    const fileName =
      data.date +
      "_" +
      cleanMerchant +
      "_" +
      data.total.toFixed(2) +
      "." +
      extension;


    const metadata = {

      name:
        fileName,

      parents:
        [
          DRIVE_FOLDER_ID
        ],

      description:
        [
          "Scanya Receipt",
          "Merchant: " +
            data.merchant,
          "Total: $" +
            data.total.toFixed(2),
          "Category: " +
            data.category
        ].join(" | ")

    };


    const boundary =
      "scanya_boundary_" +
      Date.now();


    const metadataBlob =
      new Blob(

        [
          JSON.stringify(
            metadata
          )
        ],

        {
          type:
            "application/json"
        }

      );


    const body =
      new Blob(

        [

          "--" +
          boundary +
          "\r\n",

          "Content-Type: application/json; charset=UTF-8\r\n\r\n",

          metadataBlob,

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

        ]

      );


    const response =
      await fetch(

        "https://www.googleapis.com/upload/drive/v3/files" +
        "?uploadType=multipart" +
        "&fields=id,name,webViewLink",

        {

          method:
            "POST",

          headers: {

            Authorization:
              "Bearer " +
              googleAccessToken,

            "Content-Type":
              "multipart/related; boundary=" +
              boundary

          },

          body:
            body

        }

      );


    if (!response.ok) {

      const errorText =
        await response.text();


      throw new Error(
        errorText
      );

    }


    return await response.json();

  }


  /* ==========================================
     FUNCIONES DE IMAGEN
     ========================================== */

  function dataURLtoBlob(dataURL) {

    const parts =
      dataURL.split(",");


    const mime =
      parts[0]
        .match(
          /:(.*?);/
        )[1];


    const binary =
      atob(
        parts[1]
      );


    const array =
      new Uint8Array(
        binary.length
      );


    for (
      let i = 0;
      i < binary.length;
      i++
    ) {

      array[i] =
        binary.charCodeAt(i);

    }


    return new Blob(
      [array],
      {
        type:
          mime
      }
    );

  }


  function sanitizeFileName(name) {

    return name

      .replace(
        /[^a-z0-9]/gi,
        "_"
      )

      .replace(
        /_+/g,
        "_"
      )

      .substring(
        0,
        40
      );

  }


  /* ==========================================
     LOCAL STORAGE
     ========================================== */

  function getReceipts() {

    try {

      return JSON.parse(
        localStorage.getItem(
          "scanyaReceipts"
        )
      ) || [];

    }

    catch (error) {

      return [];

    }

  }


  function resetForm() {

    merchantInput.value =
      "";


    totalInput.value =
      "";


    noteInput.value =
      "";


    dateInput.value =
      getToday();


    currentImage =
      "";


    camera.value =
      "";


    preview.src =
      "";


    preview.style.display =
      "none";


    previewPlaceholder.style.display =
      "block";

  }


  /* ==========================================
     UTILIDADES
     ========================================== */

  function getToday() {

    const now =
      new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );


    return (
      year +
      "-" +
      month +
      "-" +
      day
    );

  }


  function money(value) {

    return new Intl
      .NumberFormat(

        "en-US",

        {

          style:
            "currency",

          currency:
            "USD"

        }

      )
      .format(
        value
      );

  }


  /* ==========================================
     TARJETA DE RECIBO
     ========================================== */

  function receiptCard(receipt) {

    const image =
      receipt.image
        ? receipt.image
        : "";


    return `

      <div class="receipt-card">

        ${
          image

            ?

            `
            <img
              class="receipt-thumb"
              src="${image}"
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

            ${receipt.date}

            ·

            ${receipt.category}

          </div>

        </div>


        <div class="receipt-amount">

          ${money(
            receipt.total
          )}

        </div>

      </div>

    `;

  }


  /* ==========================================
     ACTUALIZAR INTERFAZ
     ========================================== */

  function updateUI() {

    const receipts =
      getReceipts();


    updateHome(
      receipts
    );


    updateReceipts(
      receipts
    );


    updateExpenses(
      receipts
    );


    updateReports(
      receipts
    );

  }


  function updateHome(receipts) {

    const today =
      new Date();


    const month =
      today.getMonth();


    const year =
      today.getFullYear();


    const monthReceipts =
      receipts.filter(
        function (receipt) {

          const date =
            new Date(
              receipt.date +
              "T12:00:00"
            );


          return (

            date.getMonth() ===
              month

            &&

            date.getFullYear() ===
              year

          );

        }
      );


    const total =
      monthReceipts.reduce(

        function (
          sum,
          receipt
        ) {

          return (
            sum +
            receipt.total
          );

        },

        0

      );


    document
      .getElementById(
        "monthTotal"
      )
      .textContent =
      money(
        total
      );


    document
      .getElementById(
        "receiptCount"
      )
      .textContent =
      monthReceipts.length +
      " recibos";


    document
      .getElementById(
        "currentMonth"
      )
      .textContent =
      today.toLocaleDateString(

        "es-US",

        {
          month:
            "long"
        }

      );


    const recent =
      document.getElementById(
        "recentReceipts"
      );


    if (
      !receipts.length
    ) {

      recent.innerHTML =
        `

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

        .slice(
          0,
          4
        )

        .map(
          receiptCard
        )

        .join(
          ""
        );

  }


  function updateReceipts(receipts) {

    const container =
      document.getElementById(
        "allReceipts"
      );


    if (
      !receipts.length
    ) {

      container.innerHTML =
        `

        <div class="empty-state">

          No hay recibos guardados.

        </div>

        `;


      return;

    }


    container.innerHTML =
      receipts

        .map(
          receiptCard
        )

        .join(
          ""
        );

  }


  function updateExpenses(receipts) {

    const total =
      receipts.reduce(

        function (
          sum,
          receipt
        ) {

          return (
            sum +
            receipt.total
          );

        },

        0

      );


    document
      .getElementById(
        "allTimeTotal"
      )
      .textContent =
      money(
        total
      );


    const categories =
      {};


    receipts.forEach(
      function (receipt) {

        categories[
          receipt.category
        ] =

          (
            categories[
              receipt.category
            ] || 0
          )

          +

          receipt.total;

      }
    );


    const container =
      document.getElementById(
        "categorySummary"
      );


    if (
      !Object.keys(
        categories
      ).length
    ) {

      container.innerHTML =
        `

        <div class="empty-state">

          No hay gastos registrados.

        </div>

        `;


      return;

    }


    container.innerHTML =
      Object

        .entries(
          categories
        )

        .sort(
          function (
            a,
            b
          ) {

            return (
              b[1] -
              a[1]
            );

          }
        )

        .map(
          function (
            entry
          ) {

            const category =
              entry[0];


            const amount =
              entry[1];


            return `

              <div class="summary-row">

                <span>
                  ${category}
                </span>

                <strong>
                  ${money(amount)}
                </strong>

              </div>

            `;

          }
        )

        .join(
          ""
        );

  }


  function updateReports(receipts) {

    const now =
      new Date();


    const monthly =
      receipts.filter(
        function (receipt) {

          const d =
            new Date(
              receipt.date +
              "T12:00:00"
            );


          return (

            d.getMonth() ===
              now.getMonth()

            &&

            d.getFullYear() ===
              now.getFullYear()

          );

        }
      );


    const monthlyTotal =
      monthly.reduce(

        function (
          sum,
          receipt
        ) {

          return (
            sum +
            receipt.total
          );

        },

        0

      );


    document
      .getElementById(
        "reportMonthTotal"
      )
      .textContent =
      money(
        monthlyTotal
      );


    const merchants =
      {};


    receipts.forEach(
      function (receipt) {

        merchants[
          receipt.merchant
        ] =

          (
            merchants[
              receipt.merchant
            ] || 0
          )

          +

          receipt.total;

      }
    );


    const topMerchant =
      Object

        .entries(
          merchants
        )

        .sort(
          function (
            a,
            b
          ) {

            return (
              b[1] -
              a[1]
            );

          }
        )[0];


    document
      .getElementById(
        "topMerchant"
      )
      .textContent =

      topMerchant
        ? topMerchant[0]
        : "—";


    const categories =
      {};


    receipts.forEach(
      function (receipt) {

        categories[
          receipt.category
        ] =

          (
            categories[
              receipt.category
            ] || 0
          )

          +

          receipt.total;

      }
    );


    const topCategory =
      Object

        .entries(
          categories
        )

        .sort(
          function (
            a,
            b
          ) {

            return (
              b[1] -
              a[1]
            );

          }
        )[0];


    document
      .getElementById(
        "topCategory"
      )
      .textContent =

      topCategory
        ? topCategory[0]
        : "—";

  }


  /* ==========================================
     BÚSQUEDA
     ========================================== */

  document
    .getElementById(
      "receiptSearch"
    )
    .addEventListener(

      "input",

      function () {

        const search =
          this.value
            .toLowerCase()
            .trim();


        const receipts =
          getReceipts()
            .filter(

              function (
                receipt
              ) {

                return receipt
                  .merchant
                  .toLowerCase()
                  .includes(
                    search
                  );

              }

            );


        const container =
          document.getElementById(
            "allReceipts"
          );


        container.innerHTML =

          receipts.length

            ?

            receipts
              .map(
                receiptCard
              )
              .join(
                ""
              )

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