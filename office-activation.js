(function () {
  const productionApiEndpoint = "https://catsoft.store/api/office-confirmation";
  const apiEndpoint = window.CATSOFT_OFFICE_ACTIVATION_API || getDefaultApiEndpoint();

  const elements = {
    form: document.getElementById("activationForm"),
    customerName: document.getElementById("customerName"),
    orderNumber: document.getElementById("orderNumber"),
    installationId: document.getElementById("installationId"),
    confirmationId: document.getElementById("confirmationId"),
    adminNotes: document.getElementById("adminNotes"),
    screenshotInput: document.getElementById("screenshotInput"),
    screenshotPreviewWrap: document.getElementById("screenshotPreviewWrap"),
    screenshotPreview: document.getElementById("screenshotPreview"),
    ocrProgress: document.getElementById("ocrProgress"),
    ocrProgressBar: document.getElementById("ocrProgressBar"),
    ocrStatus: document.getElementById("ocrStatus"),
    copyStatus: document.getElementById("copyStatus"),
    resetBtn: document.getElementById("resetBtn"),
    generateBtn: document.getElementById("generateBtn"),
    copyConfirmationBtn: document.getElementById("copyConfirmationBtn")
  };

  let activeRequestId = 0;

  function getDefaultApiEndpoint() {
    const hostname = window.location.hostname.toLowerCase();
    const isLocalPage = !hostname || hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalPage || hostname !== "catsoft.store") {
      return productionApiEndpoint;
    }

    return "/api/office-confirmation";
  }

  function valueOf(field) {
    return field.value.trim();
  }

  function normalizeDigitText(value) {
    return String(value || "")
      .replace(/[Oo]/g, "0")
      .replace(/[Il|]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/[Bb]/g, "8");
  }

  function digitsOnly(value) {
    return normalizeDigitText(value).replace(/\D/g, "");
  }

  function formatInstallationId(value) {
    const digits = digitsOnly(value).slice(0, 63);
    return digits.match(/.{1,7}/g)?.join(" ") || "";
  }

  function formatConfirmationId(value) {
    const digits = digitsOnly(value).slice(0, 48);
    return digits.match(/.{1,6}/g)?.join(" ") || "";
  }

  function isValidInstallationId(value) {
    return digitsOnly(value).length === 63;
  }

  function extractInstallationId(text) {
    const normalized = normalizeDigitText(text);
    const runs = normalized.match(/\d+/g) || [];
    const groupedRuns = runs.filter((run) => run.length >= 6 && run.length <= 8);

    for (let index = 0; index <= groupedRuns.length - 9; index += 1) {
      const candidate = groupedRuns.slice(index, index + 9).join("");
      if (candidate.length === 63) {
        return formatInstallationId(candidate);
      }
    }

    const exactPattern = /(?:\d[\s-]*){63}/g;
    const exactMatches = normalized.match(exactPattern) || [];

    for (const match of exactMatches) {
      const candidate = digitsOnly(match);
      if (candidate.length === 63) {
        return formatInstallationId(candidate);
      }
    }

    const longRuns = runs.filter((run) => run.length >= 5).join("");
    if (longRuns.length >= 63) {
      return formatInstallationId(longRuns);
    }

    return "";
  }

  function extractConfirmationId(text) {
    const runs = normalizeDigitText(text).match(/\d+/g) || [];
    const groupedRuns = runs.filter((run) => run.length >= 5 && run.length <= 7);

    for (let index = 0; index <= groupedRuns.length - 8; index += 1) {
      const candidate = groupedRuns.slice(index, index + 8).join("");
      if (candidate.length >= 48) {
        return formatConfirmationId(candidate);
      }
    }

    const digits = digitsOnly(text);
    return digits.length >= 48 ? formatConfirmationId(digits) : "";
  }

  function setStatus(message) {
    elements.copyStatus.textContent = message;
  }

  function setLoading(isLoading) {
    elements.generateBtn.disabled = isLoading;
    elements.generateBtn.textContent = isLoading ? "Memproses..." : "Ambil Confirmation ID";
  }

  function setOcrProgress(percent) {
    elements.ocrProgress.hidden = false;
    elements.ocrProgressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function resetOcrProgress() {
    elements.ocrProgress.hidden = true;
    elements.ocrProgressBar.style.width = "0%";
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      setStatus(successMessage);
    } catch (error) {
      fallbackCopy(text);
      setStatus(successMessage);
    }
  }

  function htmlToText(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    return (template.content.textContent || template.innerHTML || "")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  async function runOcr(imageSource) {
    if (!window.Tesseract) {
      elements.ocrStatus.textContent = "OCR belum tersedia. Paste Installation ID secara manual.";
      return "";
    }

    elements.ocrStatus.textContent = "Membaca screenshot...";
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(imageSource, "eng", {
        logger: (message) => {
          if (message.status === "recognizing text") {
            const percent = Math.round(message.progress * 100);
            setOcrProgress(percent);
            elements.ocrStatus.textContent = `Membaca screenshot... ${percent}%`;
          }
        }
      });

      const foundId = extractInstallationId(result.data.text || "");

      if (!foundId) {
        elements.ocrStatus.textContent = "OCR selesai, tapi Installation ID belum ditemukan. Paste atau koreksi manual.";
        setStatus("Perlu koreksi manual sebelum mengambil Confirmation ID.");
        return "";
      }

      elements.installationId.value = foundId;
      elements.ocrStatus.textContent = "Installation ID berhasil dibaca. Mengambil Confirmation ID...";
      setOcrProgress(100);
      await requestConfirmation();
      return foundId;
    } catch (error) {
      elements.ocrStatus.textContent = "OCR gagal membaca screenshot. Paste Installation ID secara manual.";
      setStatus("OCR gagal membaca screenshot.");
      return "";
    } finally {
      window.setTimeout(resetOcrProgress, 600);
    }
  }

  async function requestConfirmation() {
    const requestId = activeRequestId + 1;
    activeRequestId = requestId;

    const formattedId = formatInstallationId(valueOf(elements.installationId));
    if (!isValidInstallationId(formattedId)) {
      setStatus("Installation ID harus 63 digit atau 9 grup angka.");
      return;
    }

    elements.installationId.value = formattedId;
    elements.confirmationId.value = "";
    setStatus("Mengambil Confirmation ID...");
    setLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          installationId: formattedId,
          customerName: valueOf(elements.customerName),
          orderNumber: valueOf(elements.orderNumber),
          notes: valueOf(elements.adminNotes)
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (requestId !== activeRequestId) {
        return;
      }

      if (!response.ok || payload.ok === false) {
        const errorMessage = payload.error || payload.message || "Gagal mengambil Confirmation ID dari seller.";
        setStatus(errorMessage);
        return;
      }

      const message = htmlToText(payload.message || payload.html || payload.raw || "");
      const confirmationId = payload.confirmationId || extractConfirmationId(message);

      elements.confirmationId.value = confirmationId || "";
      setStatus(confirmationId ? "Confirmation ID berhasil diambil." : "Response diterima, tetapi Confirmation ID belum terbaca.");
    } catch (error) {
      setStatus("Gagal menghubungi endpoint Catsoft.");
    } finally {
      if (requestId === activeRequestId) {
        setLoading(false);
      }
    }
  }

  function resetForm() {
    activeRequestId += 1;
    elements.customerName.value = "";
    elements.orderNumber.value = "";
    elements.installationId.value = "";
    elements.confirmationId.value = "";
    elements.adminNotes.value = "";
    elements.screenshotInput.value = "";
    elements.screenshotPreview.removeAttribute("src");
    elements.screenshotPreviewWrap.classList.add("is-hidden");
    elements.ocrStatus.textContent = "Belum ada screenshot dipilih.";
    setStatus("Form sudah dikosongkan.");
    resetOcrProgress();
    setLoading(false);
  }

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    requestConfirmation();
  });

  elements.screenshotInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    elements.screenshotPreview.src = previewUrl;
    elements.screenshotPreviewWrap.classList.remove("is-hidden");
    runOcr(previewUrl);
  });

  elements.installationId.addEventListener("blur", () => {
    if (valueOf(elements.installationId)) {
      elements.installationId.value = formatInstallationId(valueOf(elements.installationId));
    }
  });

  elements.copyConfirmationBtn.addEventListener("click", () => {
    const confirmationId = valueOf(elements.confirmationId);
    copyText(confirmationId, confirmationId ? "Confirmation ID sudah dicopy." : "Belum ada Confirmation ID untuk dicopy.");
  });

  elements.resetBtn.addEventListener("click", resetForm);
})();
