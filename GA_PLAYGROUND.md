Let's do it properly, but without any magic: one clear scenario - **regular site + GTM + GA4 + your package via CDN**.
At the end I'll briefly show how it differs if you connect the package via npm/SPA.

Below is a **real step-by-step plan** you can simply repeat.

---

## 0. What we will do

Goal:

* Any site (static / SPA)
* **GTM** connected
* **GA4** configured inside GTM
* Your package connected on the page
  `@appsurify-testmap/google-custom-event-tracker`
* On clicks / data entry we send a **`ui_event` event** to GA4 with parameters
  (`type`, `tag`, `selector`, `text`, `path`, `ts`) 

---

## 1. Prepare accounts

### 1.1. Google Analytics 4

1. Go to **Google Analytics**.
2. Create/select a GA4 property.
3. In **Admin -> Data Streams -> Web** create a stream for your domain.
4. Copy the Measurement ID like `G-XXXXXXX`.

### 1.2. Google Tag Manager

1. Open **tagmanager.google.com**.
2. Create a container for the site (Web).
3. In **Admin -> Install Google Tag Manager** copy the GTM snippet (code like `GTM-XXXX`).

---

## 2. Connect GTM to the site

Add to the site layout / HTML template:

**In `<head>`:**

```html
<!-- Google Tag Manager -->
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-XXXXXXX");
</script>
<!-- End Google Tag Manager -->
```

**Right after `<body>`:**

```html
<!-- Google Tag Manager (noscript) -->
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0"
    width="0"
    style="display: none; visibility: hidden"
  ></iframe>
</noscript>
<!-- End Google Tag Manager (noscript) -->
```

Here `GTM-XXXXXXX` is your ID.

---

## 3. Configure GA4 in GTM

Inside GTM:

1. Go to **Tags -> New**.
2. Type: **Google Analytics: GA4 Configuration**.
3. Insert `Measurement ID` (`G-XXXXXXX`).
4. Trigger: **All Pages**.
5. Save.

This replaces the "manual" snippet `gtag("config", ...)` - now everything goes through GTM.

---

## 4. Connect your package on the page (via CDN)

We use the UMD build from README/README-DEV.

Add after the GTM script (but before your custom scripts):

```html
<script src="https://cdn.jsdelivr.net/npm/@appsurify-testmap/google-custom-event-tracker/dist/google-custom-event.umd.js"></script>
<script>
  // Initialize our tracker
  window.GoogleCustomEventTracker.init({
    send(payload) {
      // Send to GTM via dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "ui_event",
        ...payload,
      });
    },
    // flags are optional to configure
    captureSelector: true,
    captureText: true,
    capturePath: true,
    captureXPath: false,
  });
</script>
```

Here is the main flow:

* **our package** listens to DOM events (click, input, change, etc.)
* for each event it calls `send(payload)`
* in `send` we push an object to `dataLayer` with `event: "ui_event"`
* GTM will catch these `ui_event` as a **Custom Event** 

---

## 5. Configure trigger and tag in GTM

Now we need to tell GTM what to do with `ui_event`.

### 5.1. Custom Event trigger

1. In GTM -> **Triggers -> New**.
2. Type: **Custom Event**.
3. Name, for example: `UI Event Trigger`.
4. Event name: `ui_event`.
5. This trigger fires on: **All Custom Events** (or just leave as is).
6. Save.

(This matches our README-GA4; you can rename if you want.)

### 5.2. GA4 Event Tag for `ui_event`

1. In GTM -> **Tags -> New**.

2. Type: **Google Analytics: GA4 Event**.

3. Configuration Tag: choose the GA4 config tag created earlier.

4. Event name: `ui_event` (or any other, but it should match what you want to see in GA4).

5. In Event Parameters add:

   | Parameter Name | Value          |
   | -------------- | -------------- |
   | `type`         | `{{type}}`     |
   | `tag`          | `{{tag}}`      |
   | `selector`     | `{{selector}}` |
   | `path`         | `{{path}}`     |
   | `text`         | `{{text}}`     |
   | `ts`           | `{{ts}}`       |

   Create these variables as **Data Layer Variable**:

   * **Variables -> New -> Data Layer Variable**
   * Data Layer Variable Name: `type`, `tag`, `selector`, `path`, `text`, `ts`
   * Name them e.g.: `DLV - type`, `DLV - selector`, etc.

6. Trigger: choose `UI Event Trigger` (from step 5.1).

7. Save.

---

## 6. Create Custom Dimensions in GA4

To use parameters nicely in reports, create Custom Dimensions.

In GA4 (Admin -> Custom definitions -> Custom dimensions):

Create following the table:

| Name         | Scope | Event parameter | Type   |
| ------------ | ----- | --------------- | ------ |
| UI Type      | Event | `type`          | string |
| UI Tag       | Event | `tag`           | string |
| UI Selector  | Event | `selector`      | string |
| UI Text      | Event | `text`          | string |
| UI Path      | Event | `path`          | string |
| UI Timestamp | Event | `ts`            | number |

Now `ui_event` and its parameters will be available in reports.

---

## 7. Verify it works (Debug)

1. In GTM -> click **Preview**.
2. Enter the site URL (locally it can be `http://localhost:3000`, etc.).
3. Your site + Tag Assistant will open.
4. Click elements, enter text in a field.
5. In Tag Assistant:

   * Ensure the `UI Event Trigger` fires.
   * Ensure the GA4 Event Tag sends `ui_event`.
6. In GA4 -> **DebugView**:

   * `ui_event` events with parameters should appear.

---

## 8. Alternative: direct `gtag` instead of GTM

If you want it **without GTM**, you can do it simpler (from README-GA4 / main README):

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXX");
</script>

<script src="https://cdn.jsdelivr.net/npm/@appsurify-testmap/google-custom-event-tracker/dist/google-custom-event.umd.js"></script>
<script>
  GoogleCustomEventTracker.init({
    send(payload) {
      gtag("event", "ui_event", payload);
    },
  });
</script>
```

Here:

* no GTM container
* we directly call `gtag('event', 'ui_event', payload)`

Custom Dimensions in GA4 are configured **exactly the same way**.

---

## 9. Self-host the build (if CDN is not allowed)

If you need self-hosting (described in README-SELF):

1. Install the package:

   ```bash
   npm install @appsurify-testmap/google-custom-event-tracker
   ```

2. Copy:

   ```text
   node_modules/@appsurify-testmap/google-custom-event-tracker/dist/google-custom-event-tracker.umd.js
   -> public/assets/google-custom-event-tracker.umd.js
   ```

3. Connect:

   ```html
   <script src="/assets/google-custom-event-tracker.umd.js"></script>
   <script>
     GoogleCustomEventTracker.init({
       send(payload) {
         dataLayer.push({
           event: "ui_event",
           ...payload,
         });
       },
   });
   </script>
   ```

The rest of the GTM/GA4 setup stays the same.

---

## 10. If the site is SPA (React/Vite/Next)

Then:

* GTM/GA4 are connected **exactly the same way**, through the HTML template / `_document` / `<Head>`.
* The package can be connected **via npm** and `initTracker` called once after the app mounts:

```ts
import { useEffect } from "react";
import { initTracker } from "@appsurify-testmap/google-custom-event-tracker";

function App() {
  useEffect(() => {
    initTracker({
      send(payload) {
        window.dataLayer.push({
          event: "ui_event",
          ...payload,
        });
      },
    });
  }, []);

  return <YourAppUI />;
}
```

After that everything is the same as in steps 5-7.

---

If you want, next we can:

* break down a specific framework (Next.js / Vite / CRA)
* sketch a ready `layout.tsx / _document.tsx` with GTM + the package
* add a couple of test buttons/forms and show which events you'll see in GA4 DebugView.
