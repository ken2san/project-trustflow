# TrustFlow Development Roadmap (For VSCode & Copilot)

Tips and prompts for the next steps after copying code from Canvas and working with Copilot.

## 1. Organize Project Structure

When App.jsx becomes too large, ask Copilot to split components as follows:

**Prompt Example:**

```
Split the Marketplace, Scoping, and Contract views in App.jsx into separate files under src/components/ and export them.
```

## 2. Data Persistence with Firebase

To actually save "point deposits" and "contract status," introduce Firebase with Copilot.

**Prompt Example:**

```
Use Firebase Firestore to implement logic that saves and synchronizes the status of selectedJob and the user's point balance.
```

> **Note:** If you tell Copilot the escrow rules (Rule 1-3), it will generate safer code.

## 3. Implement AI Logic

Currently, dummy data is used for "AI diagnosis" and "DoD generation." Connect these features to the Gemini API.

**Prompt Example:**

```
Use the Gemini API to create a function that automatically generates 5 Acceptance Criteria from the project summary.
```

## 4. Add Dispute Resolution Logic

**Prompt Example:**

```
When the AI Inspection Score falls below a certain threshold, transition to the Dispute view and add a flow to notify the admin.
```

## 5. Export & Reporting Features

Implement features to keep evidence of transactions.

**Prompt Example:**

```
Export the currently displayed Audit Trail and DoD agreement contents as PDF using libraries like jspdf.
```

---

### Development Tips

- **Utilize Context:** If you use Copilot Chat while App.jsx is open in VSCode, you will get more accurate advice based on code context.
- **Environment Variables:** Always save API keys in a `.env` file, and tell Copilot, "Modify the code to load API keys from .env."
