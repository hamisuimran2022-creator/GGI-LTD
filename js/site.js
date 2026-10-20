
(function () {
    "use strict";

    const gallery = document.getElementById("gimiscoMediaGallery");
    if (!gallery) return;

    const config = window.GIMISCO_SUPABASE_URL;
    const key = window.GIMISCO_SUPABASE_ANON_KEY;
    const bucket = window.GIMISCO_MEDIA_BUCKET || "gimisco-media";

    if (!config || !key ||
        config.includes("YOUR_PROJECT_URL") ||
        key.includes("YOUR_PUBLISHABLE")) {
        gallery.textContent = "Configure Supabase to display GGI media.";
        return;
    }

    const client = window.supabase.createClient(config, key);

    function showMessage(message, className) {
        gallery.replaceChildren();
        const box = document.createElement("div");
        box.className = className;
        box.textContent = message;
        gallery.appendChild(box);
    }

    function safeMediaUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === "https:" ? url.href : null;
        } catch {
            return null;
        }
    }

    async function loadMedia() {
        showMessage("Loading GGI media...", "gimisco-media-loading");

        const { data, error } = await client
            .from("media")
            .select("id,title,description,url,type,created_at,storage_path")
            .order("created_at", { ascending: false })
            .limit(60);

        if (error) {
            console.error("GIMISCO media error:", error.message);
            showMessage("Media could not be loaded. Please try again later.",
                "gimisco-media-error");
            return;
        }

        if (!data || data.length === 0) {
            showMessage("No media has been published yet.",
                "gimisco-media-empty");
            return;
        }

        gallery.replaceChildren();

        for (const item of data) {
            if (item.type !== "image" && item.type !== "video") continue;

            const url = safeMediaUrl(item.url);
            if (!url) continue;

            const card = document.createElement("article");
            card.className = "gimisco-media-card";

            let media;
            if (item.type === "video") {
                media = document.createElement("video");
                media.controls = true;
                media.playsInline = true;
                media.preload = "metadata";
            } else {
                media = document.createElement("img");
                media.loading = "lazy";
                media.alt = item.title || "GIMISCO project media";
            }

            media.src = url;
            media.classList.add("gimisco-media-asset");

            const overlay = document.createElement("div");
            overlay.className = "gimisco-media-overlay";

            const type = document.createElement("span");
            type.className = "gimisco-media-type";
            type.textContent = item.type.toUpperCase();

            const title = document.createElement("h3");
            title.className = "gimisco-media-card-title";
            title.textContent = item.title || "GIMISCO media";

            overlay.append(type, title);

            if (item.description) {
                const description = document.createElement("p");
                description.className = "gimisco-media-card-description";
                description.textContent = item.description;
                overlay.appendChild(description);
            }

            card.append(media, overlay);
            gallery.appendChild(card);
        }

        if (!gallery.children.length) {
            showMessage("No supported media is available.",
                "gimisco-media-empty");
        }

        if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
        }
    }

    loadMedia().catch(function (error) {
        console.error("GIMISCO gallery error:", error);
        showMessage("Unable to load GGI media.",
            "gimisco-media-error");
    });
})();
