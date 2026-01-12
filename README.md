# Disclone

A Discord-inspired clone optimized for mobile, featuring secure access codes and real-time messaging.

## 🚀 Live Demo
Access the web app here: **[https://Aadiljm.github.io/Disclone/](https://Aadiljm.github.io/Disclone/)**

---

## ☁️ Automate Server Deployment (Permanent Hosting)
To keep the chat working 24/7 without your laptop, deploy the server to the cloud.

1. **Click the button below** to deploy to Render:
   
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Aadiljm/Disclone)

2. **Configure Render:**
   - Sign in with GitHub.
   - It will ask for `MONGO_URI`. You need a free database from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Click **Apply**.

3. **Finalize Connection:**
   - Copy the URL Render gives you (e.g., `https://disclone-server.onrender.com`).
   - Open specific file `src/config.js` in this repo/folder.
   - Update `API_BASE_URL` with that link.
   - Commit & Push (the GitHub Action will auto-update the site).
