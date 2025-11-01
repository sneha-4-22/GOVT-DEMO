

# **MGNREGA District Performance Dashboard**

A citizen-friendly dashboard that helps people across rural India understand the performance of their district under the **MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act)** scheme.
The goal is to make government data accessible to low-literacy populations through an intuitive bilingual interface and a reliable backend that does not depend on live government API uptime.

This project was built as part of the **“Our Voice, Our Rights”** Take-Home Challenge.

---

## ✅ **Problem**

The Government of India provides an open API for MGNREGA monthly district performance:
**[https://www.data.gov.in/catalog/mahatma-gandhi-national-rural-employment-guarantee-act-mgnrega](https://www.data.gov.in/catalog/mahatma-gandhi-national-rural-employment-guarantee-act-mgnrega)**

But the data:

* is not easy for common citizens to understand
* is not always available (rate-limits, downtimes, throttling)
* requires technical knowledge to interpret
* has no simple district-level visualization tools

---

## ✅ **Solution**

This project provides:

* A **web app** where any citizen can select their district and instantly understand its performance
* A **simple interface** designed for low-literacy rural users
* **Bilingual support** (English & Hindi)
* **Charts & visualizations** that explain demand, supply, expenditure, work progress, and trends
* A **robust backend** that syncs government API data to a **self-hosted database** to ensure:

  * no downtime
  * no rate limiting
  * fast access nationwide

---

## ✅ **Core Features**

### **Frontend**

* 🌐 **Bilingual:** EN / हिंदी toggle
* 📊 **Visualizations using Recharts:**

  * Demand vs Supply
  * Person-days
  * Expenditure
  * Works completed
  * 5-year trends
* 📍 **Auto Location Detection:** Suggests nearest UP district
* 📱 **Responsive UI:** Mobile-friendly for rural smartphone users

### **Backend**

* Built with **Node.js + Express**
* Fetches data from data.gov.in API
* Stores all data into **Appwrite Database**
* Provides secure REST APIs:

  * `/api/sync/:district`
  * `/api/sync-all`
  * `/health`
* Automatically handles:

  * throttling
  * rate limiting
  * retries
  * duplicate document prevention
  * updating sync timestamps

### **Data Storage**

Using **Appwrite Cloud** with:

* Database
* MGNREGA Collection
* Fields for district, employment metrics, financial year, expenditure, and sync time

---

## ✅ **Technical Architecture**

### **1. Frontend**

* React (Hooks)
* Tailwind CSS
* Recharts
* Lucide Icons
* Browser Geolocation API

### **2. Backend**

* Node.js
* Express
* Axios (for government API)
* Appwrite SDK
* Hosted on a server (VM/VPS)

### **3. Database**

* Appwrite Cloud
* District-level documents
* Attribute fields:

  * households
  * job cards
  * employment demand/supply
  * person-days
  * works completed
  * expenditure
  * last synced

### **4. Production-Ready Strategies**

* Backend caches data so frontend never depends on live API
* Controlled request rate to avoid government throttling
* Robust sync endpoint
* Health check endpoint
* Auto-seeding fallback for new districts

---

## ✅ **How It Works**

### **User Flow**

1. User opens the dashboard
2. Website auto-detects their location
3. District is pre-selected or manually chosen
4. Dashboard displays:

   * current performance
   * past 5 years’ records
   * visual charts
   * works progress
   * expenditure
5. User taps “Sync Data” to refresh the district (if online)

---

## ✅ **Backend APIs**

### **POST /api/sync/:district**

Fetches live data from data.gov.in and stores it into Appwrite.

### **POST /api/sync-all**

Syncs predefined top districts with rate-limiting.

### **GET /health**

Health check endpoint for server uptime monitoring.

---

## ✅ **Hosting**

* Backend hosted on render

---

## ✅ **Submission Deliverables**

**1. Loom Walkthrough Video (< 2 minutes)**
Explaining:



**2. Public URL**
Accessible hosted version of the dashboard


---

## ✅ **Bonus Feature Implemented**

✅ Auto-detection of district using GPS
✅ Automatic fallback if location fails
✅ District suggestions

---

## ✅ **About MGNREGA**

MGNREGA is India’s largest employment guarantee scheme, providing **100 days of wage employment** to rural households. In 2025, more than **12.15 crore** people benefited from the program.

This dashboard is designed to empower citizens with accessible, transparent information about how their district is performing.

---

If you want it formatted differently or branded more, I’ll tweak it. But this is already clean enough to impress a panel.
