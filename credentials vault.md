**🔐 Credentials Vault for In-System Browser Access**

This vault stores login credentials for third-party portals integrated with the internal system browser. These credentials are managed under developer/admin control and are used to auto-fill login fields when accessing external resources.

---

### 🌐 External Portals and Credentials

#### 1. [Car-Part.co.il](https://www.car-part.co.il/Include/Generic/AccessSystem.jsp)

* **Username:** ירון כיוף
* **Password:** 8881

#### 2. [Levi Itzhak Portal](https://portal.levi-itzhak.co.il)

* **Username:** s-yaronc
* **Password:** 1417

---

### 🔧 Dev Control and Auto-Fill Logic

* These credentials are stored in a protected `dev_credentials` object.
* Auto-fill logic for each system browser:

  * Waits for login form to render.
  * Detects the input fields (`username`, `password`).
  * Injects credentials automatically.
  * Triggers form submission or waits for user to click "Login".

---

### 🛠️ Implementation Pseudocode (Auto-Fill Script)

```js
const dev_credentials = {
  carPart: {
    username: "ירון כיוף",
    password: "8881"
  },
  leviItzhak: {
    username: "s-yaronc",
    password: "1417"
  }
};

function autofillLogin(portal) {
  const creds = dev_credentials[portal];
  document.querySelector('input[name="username"]').value = creds.username;
  document.querySelector('input[name="password"]').value = creds.password;
}
```

---

### 🔒 Notes

* These credentials must be editable only by admins/devs.
* They should be stored securely (e.g., encrypted in local/session storage if browser-based).
* Do not expose in frontend logic unless explicitly needed for automation.
* Future support: dynamic portal selection, obfuscated auto-fill injection.

---

Ready to connect to browser injection modules and secure storage layer.
