// Centralized webhook endpoints (replace with your actual Make.com URLs)
const WEBHOOKS = {
  PART_SEARCH_TEXT: "https://hook.eu2.make.com/your-text-search-endpoint", // text or image query
  PART_SEARCH_IMAGE: "https://hook.eu2.make.com/your-image-search-endpoint", // PNG screenshot upload
};

// Send a textual or image-based part search query to Make.com
export async function sendPartSearch({ plate, manufacturer, model, year, query, imageFile }) {
  const url = imageFile ? WEBHOOKS.PART_SEARCH_IMAGE : WEBHOOKS.PART_SEARCH_TEXT;
  let res;
  if (imageFile) {
    // Send as multipart/form-data for image
    const formData = new FormData();
    formData.append("plate", plate || "");
    formData.append("manufacturer", manufacturer || "");
    formData.append("model", model || "");
    formData.append("year", year || "");
    formData.append("image", imageFile);
    res = await fetch(url, { method: "POST", body: formData });
  } else {
    // Send as JSON for text query
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate, manufacturer, model, year, query })
    });
  }
  // Always expect JSON result
  if (!res.ok) throw new Error("Make.com webhook failed");
  return await res.json();
}

// Example usage for posting search results (text or image): 
// const results = await sendPartSearch({ plate, manufacturer, model, year, query });
// const results = await sendPartSearch({ plate, manufacturer, model, year, imageFile });

