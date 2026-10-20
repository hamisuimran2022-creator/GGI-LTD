(() => {
  "use strict";

  const {
    createClient
  } = window.supabase;

  const supabase = createClient(
    window.GIMISCO_SUPABASE_URL,
    window.GIMISCO_SUPABASE_ANON_KEY
  );

  const loginScreen =
    document.getElementById("loginScreen");

  const dashboardScreen =
    document.getElementById("dashboardScreen");

  const loginForm =
    document.getElementById("loginForm");

  const loginMessage =
    document.getElementById("loginMessage");

  const loginButton =
    document.getElementById("loginButton");

  const logoutButton =
    document.getElementById("logoutButton");

  const uploadForm =
    document.getElementById("uploadForm");

  const uploadButton =
    document.getElementById("uploadButton");

  const uploadMessage =
    document.getElementById("uploadMessage");

  const uploadProgress =
    document.getElementById("uploadProgress");

  const adminMediaGrid =
    document.getElementById("adminMediaGrid");

  const refreshButton =
    document.getElementById("refreshButton");

  const totalMedia =
    document.getElementById("totalMedia");

  const totalImages =
    document.getElementById("totalImages");

  const totalVideos =
    document.getElementById("totalVideos");


  /* ======================================================
     HELPERS
     ====================================================== */

  function showMessage(element, text, type = "") {
    element.textContent = text;
    element.className = "message";

    if (type) {
      element.classList.add(type);
    }
  }


  function showLogin() {
    loginScreen.hidden = false;
    dashboardScreen.hidden = true;
  }


  function showDashboard() {
    loginScreen.hidden = true;
    dashboardScreen.hidden = false;
  }


  /* ======================================================
     AUTHENTICATION
     ====================================================== */

  async function checkSession() {

    const {
      data,
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error(error);
      showLogin();
      return;
    }

    if (data.session) {
      showDashboard();
      await loadMedia();
    } else {
      showLogin();
    }
  }


  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        document.getElementById("email").value.trim();

      const password =
        document.getElementById("password").value;

      loginButton.disabled = true;

      showMessage(
        loginMessage,
        "Signing in..."
      );

      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {

        showMessage(
          loginMessage,
          error.message,
          "error"
        );

        loginButton.disabled = false;
        return;
      }

      showMessage(
        loginMessage,
        "Login successful.",
        "success"
      );

      loginButton.disabled = false;

      showDashboard();

      await loadMedia();
    }
  );


  logoutButton.addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();

      showLogin();

      loginForm.reset();

      showMessage(
        loginMessage,
        "You have been logged out."
      );
    }
  );


  supabase.auth.onAuthStateChange(
    async (event, session) => {

      if (event === "SIGNED_OUT" || !session) {
        showLogin();
      }

      if (
        event === "SIGNED_IN" &&
        session
      ) {
        showDashboard();
      }
    }
  );


  /* ======================================================
     UPLOAD
     ====================================================== */

  uploadForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      uploadButton.disabled = true;

      uploadProgress.hidden = false;

      uploadProgress.textContent =
        "Preparing upload...";

      showMessage(
        uploadMessage,
        ""
      );


      const title =
        document
          .getElementById("mediaTitle")
          .value
          .trim();

      const description =
        document
          .getElementById("mediaDescription")
          .value
          .trim();

      const type =
        document
          .getElementById("mediaType")
          .value;

      const file =
        document
          .getElementById("mediaFile")
          .files[0];


      if (!file) {

        showMessage(
          uploadMessage,
          "Please select a file.",
          "error"
        );

        uploadButton.disabled = false;
        uploadProgress.hidden = true;

        return;
      }


      try {

        const extension =
          file.name
            .split(".")
            .pop()
            .toLowerCase();

        const safeName =
          file.name
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "-"
            );

        const uniqueName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}-${safeName}`;

        const filePath =
          `${type}s/${uniqueName}`;


        uploadProgress.textContent =
          "Uploading file...";


        const {
          error: uploadError
        } = await supabase.storage
          .from("gimisco-media")
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type
            }
          );


        if (uploadError) {
          throw uploadError;
        }


        uploadProgress.textContent =
          "Publishing media...";


        const {
          data: publicData
        } = supabase.storage
          .from("gimisco-media")
          .getPublicUrl(filePath);


        const publicUrl =
          publicData.publicUrl;


        const {
          error: databaseError
        } = await supabase
          .from("media")
          .insert({
            title,
            description,
            url: publicUrl,
            type
          });


        if (databaseError) {

          await supabase.storage
            .from("gimisco-media")
            .remove([filePath]);

          throw databaseError;
        }


        uploadForm.reset();

        showMessage(
          uploadMessage,
          "Media uploaded and published successfully.",
          "success"
        );

        uploadProgress.textContent =
          "Upload complete.";

        await loadMedia();


      } catch (error) {

        console.error(error);

        showMessage(
          uploadMessage,
          error.message ||
            "Upload failed. Please try again.",
          "error"
        );

        uploadProgress.hidden = true;

      } finally {

        uploadButton.disabled = false;
      }

    }
  );


  /* ======================================================
     LOAD MEDIA
     ====================================================== */

  async function loadMedia() {

    adminMediaGrid.innerHTML = `
      <div class="empty-state">
        Loading media...
      </div>
    `;


    const {
      data,
      error
    } = await supabase
      .from("media")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {

      console.error(error);

      adminMediaGrid.innerHTML = `
        <div class="empty-state">
          Unable to load media.
        </div>
      `;

      return;
    }


    const media = data || [];


    totalMedia.textContent =
      media.length;

    totalImages.textContent =
      media.filter(
        item => item.type === "image"
      ).length;

    totalVideos.textContent =
      media.filter(
        item => item.type === "video"
      ).length;


    if (!media.length) {

      adminMediaGrid.innerHTML = `
        <div class="empty-state">
          No media has been published yet.
        </div>
      `;

      return;
    }


    adminMediaGrid.innerHTML = "";


    media.forEach(item => {

      const card =
        document.createElement("article");

      card.className =
        "admin-media-card";


      const preview =
        document.createElement("div");

      preview.className =
        "admin-media-preview";


      if (item.type === "video") {

        const video =
          document.createElement("video");

        video.src = item.url;
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;

        preview.appendChild(video);

      } else {

        const image =
          document.createElement("img");

        image.src = item.url;
        image.alt = item.title || "GIMISCO media";
        image.loading = "lazy";

        preview.appendChild(image);
      }


      const info =
        document.createElement("div");

      info.className =
        "admin-media-info";


      const title =
        document.createElement("h3");

      title.textContent =
        item.title;


      const description =
        document.createElement("p");

      description.textContent =
        item.description || "";


      const meta =
        document.createElement("div");

      meta.className =
        "admin-media-meta";


      const type =
        document.createElement("span");

      type.className =
        "media-type";

      type.textContent =
        item.type;


      const deleteButton =
        document.createElement("button");

      deleteButton.className =
        "delete-button";

      deleteButton.textContent =
        "Delete";


      deleteButton.addEventListener(
        "click",
        () => deleteMedia(item)
      );


      meta.appendChild(type);
      meta.appendChild(deleteButton);

      info.appendChild(title);
      info.appendChild(description);
      info.appendChild(meta);

      card.appendChild(preview);
      card.appendChild(info);

      adminMediaGrid.appendChild(card);

    });
  }


  /* ======================================================
     DELETE MEDIA
     ====================================================== */

  async function deleteMedia(item) {

    const confirmed =
      window.confirm(
        `Delete "${item.title}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }


    try {

      const filePath =
        extractStoragePath(item.url);


      if (filePath) {

        const {
          error: storageError
        } = await supabase.storage
          .from("gimisco-media")
          .remove([filePath]);


        if (storageError) {
          console.warn(storageError);
        }
      }


      const {
        error
      } = await supabase
        .from("media")
        .delete()
        .eq("id", item.id);


      if (error) {
        throw error;
      }


      await loadMedia();

    } catch (error) {

      console.error(error);

      window.alert(
        error.message ||
        "Unable to delete media."
      );
    }
  }


  function extractStoragePath(url) {

    const marker =
      "/storage/v1/object/public/gimisco-media/";

    const index =
      url.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      url.slice(index + marker.length)
    );
  }


  /* ======================================================
     REFRESH
     ====================================================== */

  refreshButton.addEventListener(
    "click",
    loadMedia
  );


  /* ======================================================
     START
     ====================================================== */

  checkSession();

})();
