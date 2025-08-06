# 🧪 Patient Flow Test Guide: Reception → Consultation → Transfer

This guide validates the complete patient journey through the queue management system.

## 🎯 Test Flow Overview

**Patient Journey:** Reception creates token → Doctor processes → Transfer to next department

## 📋 Step-by-Step Test Instructions

### **Step 1: 🏥 Reception Creates Token**

1. **Go to the main page** (`/`)
2. **Fill out the Token Generator form:**
   - **Full Name:** "John Doe"
   - **Phone Number:** "555-123-4567" (optional)
   - **Department:** Select "Consultation"
   - **Priority:** "Normal"
3. **Click "Generate Token"**

**✅ Expected Results:**
- Success message: "Token Generated Successfully! Your queue token is C###"
- Token appears in the queue list on the right side
- Token shows status "Waiting"

### **Step 2: 👨‍⚕️ Doctor Processes Token**

1. **Log in as Doctor:**
   - Go to `/auth`
   - Email: `doctor@queue.com`
   - Password: `123456`
2. **Navigate to Queue Monitor** (should auto-redirect to `/monitor`)
3. **Process the token through stages:**

   **Stage A: Call Patient**
   - Find John Doe's token in the Consultation queue
   - Click "Call" button
   - ✅ **Verify:** Status changes to "Called"

   **Stage B: Serve Patient**
   - Click "Serve" button
   - ✅ **Verify:** Status changes to "Served"

   **Stage C: Complete Consultation**
   - Click "Complete" button
   - ✅ **Verify:** Status changes to "Completed"

### **Step 3: 🔄 Transfer to Another Department**

1. **With the token now "Completed", you'll see two transfer options:**
   - Regular "Transfer" button (outline)
   - Highlighted "Transfer to Next Dept" button (primary)
   
2. **Click either transfer button**
3. **Transfer Modal will open:**
   - Current Department: "Consultation"
   - Transfer To: Select destination (e.g., "Pharmacy", "Lab", "X-ray")
   - Reason: Optional text (e.g., "Prescription pickup required")

4. **Complete the transfer:**
   - Select destination department (e.g., "Pharmacy")
   - Add reason: "Medication dispensing"
   - Click "Transfer Patient"

**✅ Expected Results:**
- Success message: "Patient transferred to Pharmacy"
- Token disappears from Doctor's Consultation queue
- Token appears in Pharmacy queue with status "Waiting"

### **Step 4: 🔍 Verify Transfer Success**

1. **Check Pharmacy Queue:**
   - Log in as Pharmacist: `pharmacy@queue.com` / `123456`
   - Or use Admin view to see all departments
   - ✅ **Verify:** John Doe's token now appears in Pharmacy queue
   - ✅ **Verify:** Status is "Waiting"
   - ✅ **Verify:** Shows "(from Consultation)" indicator

2. **Check Database Consistency:**
   - Token department field updated to "Pharmacy"
   - Transfer history logged in queue_transfers table
   - Original timestamps preserved

## 🎮 Alternative Test Scenarios

### **Scenario A: Reception Transfer**
- Reception can also transfer completed tokens
- Log in as `reception@queue.com` / `123456`
- Reception sees all queues (view-only for most actions)
- Can transfer completed tokens between departments

### **Scenario B: Emergency Priority**
- Create token with "Emergency" priority
- Emergency tokens show red alert triangles
- Emergency tokens can be processed through same flow

### **Scenario C: Multi-Department Chain**
- Test: Reception → Consultation → Lab → Pharmacy
- Each department processes and transfers to next
- Verify token maintains patient information throughout journey

## 🔧 Department Transfer Matrix

| From Department | Available Transfer Destinations |
|----------------|----------------------------------|
| Consultation   | Lab, Pharmacy, X-ray, Scan, Billing |
| Lab            | Consultation, Pharmacy, X-ray, Scan, Billing |
| Pharmacy       | Consultation, Lab, X-ray, Scan, Billing |
| X-ray          | Consultation, Lab, Pharmacy, Scan, Billing |
| Scan           | Consultation, Lab, Pharmacy, X-ray, Billing |
| Billing        | Consultation, Lab, Pharmacy, X-ray, Scan |

## 🎯 Success Criteria Checklist

- [ ] Token creation works from Reception
- [ ] Token appears in correct department queue
- [ ] Status transitions work: Waiting → Called → Served → Completed
- [ ] Transfer button appears after completion
- [ ] Transfer modal shows correct departments
- [ ] Transfer updates token department and status
- [ ] Token appears in destination queue as "Waiting"
- [ ] Transfer history is tracked
- [ ] Real-time updates work across all dashboards

## 🚨 Known Behaviors

1. **Transfer Timing:** Tokens can be transferred at any status except "Skipped"
2. **Completed Token Special Handling:** Completed tokens get highlighted transfer button
3. **Permission System:** Only admin and department staff can manage their department's tokens
4. **Real-time Updates:** All changes reflect immediately across connected sessions

## 📊 Test Data Examples

**Sample Patients for Testing:**
- John Doe (Consultation → Pharmacy)
- Jane Smith (Consultation → Lab)
- Bob Johnson (Emergency priority, Consultation → X-ray)
- Alice Brown (Consultation → Scan → Billing)

This test flow ensures the complete patient journey works seamlessly from initial token creation through department transfers.