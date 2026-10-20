
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const loginSection = $("loginSection");
  const dashboardSection = $("dashboardSection");
  const loginForm = $("loginForm");
  const uploadForm = $("uploadForm");
  const logoutBtn = $("logoutBtn");
  const refreshBtn = $("refreshBtn");
  const mediaGrid = $("mediaGrid");

  let supabase;
  let currentUser = null;
  let mediaItems = [];

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  const allowedTypes = {
    "image/jpeg": "image",
    "image/png": "image",
    "image/webp": "image",
    "image/gif": "image",
    "video/mp4": "video",
    "video/webm": "video",
    "video/quicktime": "video"
  };

  function message(id, text, type = "") {
    const element = $(id);
    element.textContent = text;
    element.className = `message ${type}`;
  }

  function setLoggedIn(isLoggedIn) {
    loginSection.classList.toggle("hidden", isLoggedIn);
    dashboardSection.classList.toggle("hidden", !isLoggedIn);
    logoutBtn.classList.toggle("hidden", !isLoggedIn);
  }

  function configurationError() {
    if (!window.supabase || !window.GIMISCO_SUPABASE_URL ||
        !window.GIMISCO_SUPABASE_ANON_KEY ||
        window.GIMISCO_SUPABASE_URL.includes("YOUR_") ||
        window.GIMISCO_SUPABASE_ANON_KEY.includes("YOUR_")) {
      message(
        "loginMessage",
        "Configure your Supabase URL and publishable/anon key in supabase-config.js.",
        "error"
      );
      return true;
    }

    return false;
  }

  async function requireAdmin(user) {
    const { data, error } = await supabase
      .from("gimisco_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "This account is not authorized as a GIMISCO administrator. Add its user UUID to public.gimisco_admins."
      );
    }
  }

  async function showDashboard(user) {
    await requireAdmin(user);
    currentUser = user;
    setLoggedIn(true);
    await loadMedia();
  }

  async function loadMedia() {
    message("mediaMessage", "Loading media...");

    const { data, error } = await supabase
      .from("media")
      .select("id,title,description,url,type,created_at,storage_path")
      .order("created_at", { ascending: false });

    if (error) {
      message("mediaMessage", `Could not load media: ${error.message}`, "error");
      return;
    }

    mediaItems = data || [];
    renderMedia();
  }

  function safeMediaUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function renderMedia() {
    $("mediaCount").textContent = mediaItems.length;
    $("imageCount").textContent =
      mediaItems.filter(item => item.type === "image").length;
    $("videoCount").textContent =
      mediaItems.filter(item => item.type === "video").length;

    mediaGrid.replaceChildren();

    if (!mediaItems.length) {
      message("mediaMessage", "No media uploaded yet. Upload your first item.");
      return;
    }

    message("mediaMessage", `${mediaItems.length} media item(s) loaded.`);

    mediaItems.forEach(item => {
      const card = document.createElement("article");
      card.className = "media-card";

      const url = safeMediaUrl(item.url);

      if (url && item.type === "image") {
        const image = document.createElement("img");
        image.src = url;
        image.alt = item.title || "GIMISCO media";
        image.className = "media-preview";
        image.loading = "lazy";
        card.append(image);
      } else if (url && item.type === "video") {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.preload = "metadata";
        video.className = "media-preview";
        card.append(video);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "media-preview";
        placeholder.textContent = "Media URL unavailable";
        card.append(placeholder);
      }

      const content = document.createElement("div");
      content.className = "media-content";

      const title = document.createElement("h3");
      title.textContent = item.title || "Untitled media";

      const description = document.createElement("p");
      description.textContent = item.description || "No description provided.";

      const type = document.createElement("p");
      type.textContent = `Type: ${item.type}`;

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-btn";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete media";
      deleteButton.addEventListener("click", () => deleteMedia(item));

      content.append(title, description, type, deleteButton);
      card.append(content);
      mediaGrid.append(card);
    });
  }

  async function uploadMedia(event) {
    event.preventDefault();

    if (!currentUser) {
      message("uploadMessage", "Please sign in again.", "error");
      return;
    }

    const title = $("mediaTitle").value.trim();
    const description = $("mediaDescription").value.trim();
    const file = $("mediaFile").files[0];

    if (!title || !file) {
      message("uploadMessage", "Enter a title and choose a file.", "error");
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(allowedTypes, file.type)) {
      message("uploadMessage", "That file type is not supported.", "error");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      message("uploadMessage", "The file exceeds the 50 MB limit.", "error");
      return;
    }

    const type = allowedTypes[file.type];
    const extension = file.name.split(".").pop().toLowerCase();
    const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : "bin";
    const storagePath =
      `${currentUser.id}/${crypto.randomUUID()}.${safeExtension}`;

    $("uploadBtn").disabled = true;
    message("uploadMessage", "Uploading media...");

    try {
      const { error: storageError } = await supabase.storage
        .from(window.GIMISCO_MEDIA_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (storageError) throw storageError;

      const { data: publicData } = supabase.storage
        .from(window.GIMISCO_MEDIA_BUCKET)
        .getPublicUrl(storagePath);

      const publicUrl = safeMediaUrl(publicData.publicUrl);

      if (!publicUrl) {
        throw new Error("Could not create a valid public media URL.");
      }

      const { error: insertError } = await supabase
        .from("media")
        .insert({
          title,
          description,
          url: publicUrl,
          type,
          storage_path: storagePath
        });

      if (insertError) {
        // Remove the uploaded object if its database record could not be saved.
        await supabase.storage
          .from(window.GIMISCO_MEDIA_BUCKET)
          .remove([storagePath]);

        throw insertError;
      }

      uploadForm.reset();
      message("uploadMessage", "Media uploaded successfully.", "success");
      await loadMedia();
    } catch (error) {
      message(
        "uploadMessage",
        error.message || "Upload failed. Check your Supabase policies.",
        "error"
      );
    } finally {
      $("uploadBtn").disabled = false;
    }
  }

  async function deleteMedia(item) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    message("mediaMessage", "Deleting media...");

    try {
      if (item.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(window.GIMISCO_MEDIA_BUCKET)
          .remove([item.storage_path]);

        if (storageError) throw storageError;
      }

      const { error: dbError } = await supabase
        .from("media")
        .delete()
        .eq("id", item.id);

      if (dbError) throw dbError;

      message("mediaMessage", "Media deleted.", "success");
      await loadMedia();
    } catch (error) {
      message(
        "mediaMessage",
        error.message || "Could not delete media.",
        "error"
      );
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      message("loginMessage", error.message, "error");
      return;
    }

    currentUser = null;
    mediaItems = [];
    mediaGrid.replaceChildren();
    setLoggedIn(false);
  }

  async function initialize() {
    if (configurationError()) return;

    supabase = window.supabase.createClient(
      window.GIMISCO_SUPABASE_URL,
      window.GIMISCO_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    loginForm.addEventListener("submit", async event => {
      event.preventDefault();
      const button = loginForm.querySelector('button[type="submit"]');
      button.disabled = true;
      message("loginMessage", "Signing in...");

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: $("email").value.trim(),
          password: $("password").value
        });

        if (error) throw error;

        await showDashboard(data.user);
        message("loginMessage", "");
      } catch (error) {
        await supabase.auth.signOut();
        currentUser = null;
        setLoggedIn(false);
        message(
          "loginMessage",
          error.message || "Sign-in failed.",
          "error"
        );
      } finally {
        button.disabled = false;
      }
    });

    uploadForm.addEventListener("submit", uploadMedia);
    logoutBtn.addEventListener("click", signOut);
    refreshBtn.addEventListener("click", loadMedia);

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      message("loginMessage", error.message, "error");
      return;
    }

    if (session) {
      try {
        await showDashboard(session.user);
      } catch (error) {
        await supabase.auth.signOut();
        setLoggedIn(false);
        message("loginMessage", error.message, "error");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
