import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorPanel.css';

function DoctorPanel() {
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isMessageEnabled, setIsMessageEnabled] = useState(false);
  const [discount, setDiscount] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [availability, setAvailability] = useState({
    fromDate: '',
    toDate: '',
    startTime: '',
    endTime: '',
    slotDuration: '',
    breakDuration: '',
    pricePerSlot: '',
  });
  const [savedAvailabilities, setSavedAvailabilities] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('new');
  const [selectedExpired, setSelectedExpired] = useState([]);
  const [modal, setModal] = useState(null);

  // Get token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchSettings();
    fetchCoupons();
    fetchAvailabilities();
    fetchAppointments();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/settings', {
        headers: getAuthHeaders(),
      });
      setPrice(res.data.basePrice || '');
      setMessage(res.data.bookingMessage || '');
      setIsMessageEnabled(res.data.isMessageEnabled || false);
    } catch (error) {
      console.error('Error fetching settings:', error.response || error.message);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/appointments', {
        headers: getAuthHeaders(),
      });
      console.log('Appointments fetched:', res.data);
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching appointments:', error.response || error.message);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/coupons', {
        headers: getAuthHeaders(),
      });
      setCoupons(res.data);
    } catch (error) {
      console.error('Error fetching coupons:', error.response || error.message);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/availability', {
        headers: getAuthHeaders(),
      });
      setSavedAvailabilities(res.data);
    } catch (error) {
      console.error('Error fetching availabilities:', error.response || error.message);
    }
  };

  const updatePrice = async () => {
    if (!price || isNaN(price) || price <= 0) return alert('Price must be a positive number');
    try {
      await axios.post(
        'http://localhost:5000/api/settings/price',
        { doctorId: 'doctor1', basePrice: parseInt(price) },
        { headers: getAuthHeaders() }
      );
      alert('Price updated');
      fetchSettings();
    } catch (error) {
      console.error('Error updating price:', error.response || error.message);
    }
  };

  const updateMessage = async () => {
    if (isMessageEnabled && !message) return alert('Message is required when enabled');
    try {
      await axios.post(
        'http://localhost:5000/api/settings/message',
        { doctorId: 'doctor1', bookingMessage: message, isMessageEnabled },
        { headers: getAuthHeaders() }
      );
      alert('Message updated');
      fetchSettings();
    } catch (error) {
      console.error('Error updating message:', error.response || error.message);
    }
  };

  const generateCoupon = async () => {
    if (!discount || isNaN(discount) || discount < 0 || discount > 100) return alert('Discount must be between 0 and 100');
    try {
      const res = await axios.post(
        'http://localhost:5000/api/coupon',
        { doctorId: 'doctor1', discountPercentage: parseInt(discount) },
        { headers: getAuthHeaders() }
      );
      setCoupons([...coupons, { code: res.data.code, discountPercentage: discount }]);
      setDiscount('');
      fetchCoupons();
    } catch (error) {
      console.error('Error generating coupon:', error.response || error.message);
    }
  };

  const deleteCoupon = async (code) => {
    try {
      await axios.delete(`http://localhost:5000/api/coupon/${code}`, {
        headers: getAuthHeaders(),
      });
      setCoupons(coupons.filter(c => c.code !== code));
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error.response || error.message);
    }
  };

  const updateAvailability = (field, value) => {
    setAvailability(prev => ({
      ...prev,
      [field]: field === 'slotDuration' || field === 'breakDuration' || field === 'pricePerSlot'
        ? (value === '' ? '' : parseInt(value))
        : value,
    }));
  };

  const setAvailabilityHandler = async () => {
    const { fromDate, toDate, startTime, endTime, slotDuration, breakDuration, pricePerSlot } = availability;
    if (!fromDate || !toDate || !startTime || !endTime || !slotDuration || !breakDuration || !pricePerSlot) {
      return alert('All availability fields are required');
    }
    if (new Date(toDate) < new Date(fromDate)) {
      return alert('To date must be on or after from date');
    }
    if (new Date(`2000-01-01T${startTime}`) >= new Date(`2000-01-01T${endTime}`)) {
      return alert('End time must be after start time');
    }
    if (isNaN(slotDuration) || slotDuration <= 0 || isNaN(breakDuration) || breakDuration < 0 || isNaN(pricePerSlot) || pricePerSlot <= 0) {
      return alert('Invalid numeric values in availability');
    }

    try {
      await axios.post(
        'http://localhost:5000/api/availability',
        {
          doctorId: 'doctor1',
          fromDate,
          toDate,
          startTime,
          endTime,
          slotDuration,
          breakDuration,
          pricePerSlot,
        },
        { headers: getAuthHeaders() }
      );
      alert('Availability set');
      fetchAvailabilities();
      setAvailability({
        fromDate: '',
        toDate: '',
        startTime: '',
        endTime: '',
        slotDuration: '',
        breakDuration: '',
        pricePerSlot: '',
      });
    } catch (error) {
      console.error('Error setting availability:', error.response || error.message);
      alert('Failed to set availability');
    }
  };

  const deleteAvailability = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/availability/${id}`, {
        headers: getAuthHeaders(),
      });
      setSavedAvailabilities(savedAvailabilities.filter(a => a._id !== id));
    } catch (error) {
      console.error('Error deleting availability:', error.response || error.message);
    }
  };

  const deleteAppointments = async (ids) => {
    try {
      await axios.delete('http://localhost:5000/api/appointment', {
        headers: getAuthHeaders(),
        data: { ids },
      });
      setAppointments(appointments.filter(a => !ids.includes(a._id)));
      setSelectedExpired([]);
    } catch (error) {
      console.error('Error deleting appointments:', error.response || error.message);
    }
  };

  const toggleSelectExpired = (id) => {
    setSelectedExpired(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllExpired = () => {
    const expiredIds = appointments.filter(a => a.status === 'expired').map(a => a._id);
    setSelectedExpired(expiredIds);
  };

  const filteredAppointments = appointments.filter(a => {
    if (tab === 'new') return a.rebookingUsed === false;
    if (tab === 'rebook') return a.status === true && a.rebookingCode;
    if (tab === 'personal') return a.status === 'pending' && a.couponCode && !a.rebookingCode;
    if (tab === 'expired') return a.status === 'expired';
    return true;
  });

  console.log('Filtered Appointments:', filteredAppointments, 'Current Tab:', tab);

  return (
    <div className="container">
      <h1>Doctor Panel</h1>

      <div className="section">
        <h2>Set Price</h2>
        <p>Current Price: ₹{price || 'Not set'}</p>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" />
        <button onClick={updatePrice}>Update Price</button>
      </div>

      <div className="section">
        <h2>Booking Message</h2>
        <p>Current Message: {message || 'Not set'} {isMessageEnabled ? '(Enabled)' : '(Disabled)'}</p>
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter message" />
        <label>
          <input type="checkbox" checked={isMessageEnabled} onChange={e => setIsMessageEnabled(e.target.checked)} />
          Enable
        </label>
        <button onClick={updateMessage}>Update</button>
      </div>

      <div className="section">
        <h2>Generate Coupon</h2>
        <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount %" />
        <button onClick={generateCoupon}>Generate</button>
        <h3>Saved Coupons</h3>
        <ul>
          {coupons.map(c => (
            <li key={c.code}>{c.code} ({c.discountPercentage}%) <button onClick={() => deleteCoupon(c.code)}>Delete</button></li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h2>Set Availability</h2>
        <div className="availability-row">
          <div>
            <label>From Date</label>
            <input
              type="date"
              value={availability.fromDate}
              onChange={e => updateAvailability('fromDate', e.target.value)}
            />
          </div>
          <div>
            <label>To Date</label>
            <input
              type="date"
              value={availability.toDate}
              onChange={e => updateAvailability('toDate', e.target.value)}
            />
          </div>
          <div>
            <label>Start Time</label>
            <input
              type="time"
              value={availability.startTime}
              onChange={e => updateAvailability('startTime', e.target.value)}
            />
          </div>
          <div>
            <label>End Time</label>
            <input
              type="time"
              value={availability.endTime}
              onChange={e => updateAvailability('endTime', e.target.value)}
            />
          </div>
          <div>
            <label>Slot Duration (min)</label>
            <input
              type="number"
              value={availability.slotDuration}
              onChange={e => updateAvailability('slotDuration', e.target.value)}
              placeholder="Slot (min)"
            />
          </div>
          <div>
            <label>Break Duration (min)</label>
            <input
              type="number"
              value={availability.breakDuration}
              onChange={e => updateAvailability('breakDuration', e.target.value)}
              placeholder="Break (min)"
            />
          </div>
          <div>
            <label>Price per Slot</label>
            <input
              type="number"
              value={availability.pricePerSlot}
              onChange={e => updateAvailability('pricePerSlot', e.target.value)}
              placeholder="Price"
            />
          </div>
        </div>
        <button onClick={setAvailabilityHandler}>Set Availability</button>
        <h3>Saved Availabilities</h3>
        <ul>
          {savedAvailabilities.map(a => (
            <li key={a._id}>
              {new Date(a.date).toLocaleDateString()} {a.startTime} - {a.endTime} | Slot: {a.slotDuration} min | Break: {a.breakDuration} min | Price: ₹{a.pricePerSlot}
              <button onClick={() => deleteAvailability(a._id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h2>Appointments</h2>
        <div className="tabs">
          <button onClick={() => setTab('new')} className={tab === 'new' ? 'active' : ''}>New</button>
          <button onClick={() => setTab('rebook')} className={tab === 'rebook' ? 'active' : ''}>Re-Bookings</button>
          <button onClick={() => setTab('personal')} className={tab === 'personal' ? 'active' : ''}>Personal</button>
          <button onClick={() => setTab('expired')} className={tab === 'expired' ? 'active' : ''}>Expired</button>
        </div>
        {tab === 'expired' && (
          <div>
            <label>
              <input type="checkbox" checked={selectedExpired.length === filteredAppointments.length} onChange={selectAllExpired} />
              Select All
            </label>
            <button onClick={() => deleteAppointments(selectedExpired)} disabled={!selectedExpired.length}>Delete Selected</button>
          </div>
        )}
        <ul>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(a => (
              <li key={a._id} onClick={() => setModal(a)}>
                {a.firstName} {a.lastName} - {new Date(a.appointmentDate).toLocaleDateString()} {a.appointmentTime} - ₹{a.price}
                {a.rebookingCode && ` | Re-booking Code: ${a.rebookingCode}`}
                {tab === 'expired' && (
                  <input
                    type="checkbox"
                    checked={selectedExpired.includes(a._id)}
                    onChange={() => toggleSelectExpired(a._id)}
                    onClick={e => e.stopPropagation()}
                  />
                )}
              </li>
            ))
          ) : (
            <li>No appointments found for this tab.</li>
          )}
        </ul>
      </div>

      {modal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Appointment Details</h3>
            <p><strong>First Name:</strong> {modal.firstName}</p>
            <p><strong>Last Name:</strong> {modal.lastName}</p>
            <p><strong>Phone:</strong> {modal.phone}</p>
            <p><strong>Email:</strong> {modal.email}</p>
            <p><strong>Date:</strong> {new Date(modal.appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {modal.appointmentTime}</p>
            <p><strong>Price:</strong> ₹{modal.price}</p>
            <p><strong>Meeting Link:</strong> <a href={modal.meetingLink} target="_blank" rel="noopener noreferrer">{modal.meetingLink}</a></p>
            {modal.couponCode && <p><strong>Coupon Code:</strong> {modal.couponCode}</p>}
            {modal.rebookingCode && (
              <>
                <p><strong>Re-booking Code:</strong> {modal.rebookingCode}</p>
                <p><strong>Valid From:</strong> {new Date(modal.rebookingValidFrom).toLocaleString()}</p>
                <p><strong>Valid Until:</strong> {new Date(modal.rebookingValidUntil).toLocaleString()}</p>
              </>
            )}
            <button onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPanel;


// FIXME: with authentication

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './DoctorPanel.css';

// function DoctorPanel() {
//   const [price, setPrice] = useState('');
//   const [message, setMessage] = useState('');
//   const [isMessageEnabled, setIsMessageEnabled] = useState(false);
//   const [discount, setDiscount] = useState('');
//   const [coupons, setCoupons] = useState([]);
//   // Updated availability state to handle a single range
//   const [availability, setAvailability] = useState({
//     fromDate: '',
//     toDate: '',
//     startTime: '',
//     endTime: '',
//     slotDuration: '',
//     breakDuration: '',
//     pricePerSlot: '',
//   });
//   const [savedAvailabilities, setSavedAvailabilities] = useState([]);
//   const [appointments, setAppointments] = useState([]);
//   const [tab, setTab] = useState('new');
//   const [selectedExpired, setSelectedExpired] = useState([]);
//   const [modal, setModal] = useState(null);

//   useEffect(() => {
//     fetchSettings();
//     fetchCoupons();
//     fetchAvailabilities();
//     fetchAppointments();
//   }, []);

//   const fetchSettings = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/settings');
//       setPrice(res.data.basePrice || '');
//       setMessage(res.data.bookingMessage || '');
//       setIsMessageEnabled(res.data.isMessageEnabled || false);
//     } catch (error) {
//       console.error('Error fetching settings:', error.response || error.message);
//     }
//   };

//   const fetchAppointments = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/appointments');
//       console.log('Appointments fetched:', res.data);
//       setAppointments(res.data);
//     } catch (error) {
//       console.error('Error fetching appointments:', error.response || error.message);
//     }
//   };

//   const fetchCoupons = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/coupons');
//       setCoupons(res.data);
//     } catch (error) {
//       console.error('Error fetching coupons:', error.response || error.message);
//     }
//   };

//   const fetchAvailabilities = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/availability');
//       setSavedAvailabilities(res.data);
//     } catch (error) {
//       console.error('Error fetching availabilities:', error.response || error.message);
//     }
//   };

//   const updatePrice = async () => {
//     if (!price || isNaN(price) || price <= 0) return alert('Price must be a positive number');
//     try {
//       await axios.post('http://localhost:5000/api/settings/price', { doctorId: 'doctor1', basePrice: parseInt(price) });
//       alert('Price updated');
//       fetchSettings();
//     } catch (error) {
//       console.error('Error updating price:', error.response || error.message);
//     }
//   };

//   const updateMessage = async () => {
//     if (isMessageEnabled && !message) return alert('Message is required when enabled');
//     try {
//       await axios.post('http://localhost:5000/api/settings/message', { doctorId: 'doctor1', bookingMessage: message, isMessageEnabled });
//       alert('Message updated');
//       fetchSettings();
//     } catch (error) {
//       console.error('Error updating message:', error.response || error.message);
//     }
//   };

//   const generateCoupon = async () => {
//     if (!discount || isNaN(discount) || discount < 0 || discount > 100) return alert('Discount must be between 0 and 100');
//     try {
//       const res = await axios.post('http://localhost:5000/api/coupon', { doctorId: 'doctor1', discountPercentage: parseInt(discount) });
//       setCoupons([...coupons, { code: res.data.code, discountPercentage: discount }]);
//       setDiscount('');
//       fetchCoupons();
//     } catch (error) {
//       console.error('Error generating coupon:', error.response || error.message);
//     }
//   };

//   const deleteCoupon = async (code) => {
//     try {
//       await axios.delete(`http://localhost:5000/api/coupon/${code}`);
//       setCoupons(coupons.filter(c => c.code !== code));
//       fetchCoupons();
//     } catch (error) {
//       console.error('Error deleting coupon:', error.response || error.message);
//     }
//   };

//   const updateAvailability = (field, value) => {
//     setAvailability(prev => ({
//       ...prev,
//       [field]: field === 'slotDuration' || field === 'breakDuration' || field === 'pricePerSlot'
//         ? (value === '' ? '' : parseInt(value))
//         : value,
//     }));
//   };

//   const setAvailabilityHandler = async () => {
//     const { fromDate, toDate, startTime, endTime, slotDuration, breakDuration, pricePerSlot } = availability;
//     if (!fromDate || !toDate || !startTime || !endTime || !slotDuration || !breakDuration || !pricePerSlot) {
//       return alert('All availability fields are required');
//     }
//     if (new Date(toDate) < new Date(fromDate)) {
//       return alert('To date must be on or after from date');
//     }
//     if (new Date(`2000-01-01T${startTime}`) >= new Date(`2000-01-01T${endTime}`)) {
//       return alert('End time must be after start time');
//     }
//     if (isNaN(slotDuration) || slotDuration <= 0 || isNaN(breakDuration) || breakDuration < 0 || isNaN(pricePerSlot) || pricePerSlot <= 0) {
//       return alert('Invalid numeric values in availability');
//     }

//     try {
//       await axios.post('http://localhost:5000/api/availability', {
//         doctorId: 'doctor1',
//         fromDate,
//         toDate,
//         startTime,
//         endTime,
//         slotDuration,
//         breakDuration,
//         pricePerSlot,
//       });
//       alert('Availability set');
//       fetchAvailabilities();
//       // Reset form
//       setAvailability({
//         fromDate: '',
//         toDate: '',
//         startTime: '',
//         endTime: '',
//         slotDuration: '',
//         breakDuration: '',
//         pricePerSlot: '',
//       });
//     } catch (error) {
//       console.error('Error setting availability:', error.response || error.message);
//       alert('Failed to set availability');
//     }
//   };

//   const deleteAvailability = async (id) => {
//     try {
//       await axios.delete(`http://localhost:5000/api/availability/${id}`);
//       setSavedAvailabilities(savedAvailabilities.filter(a => a._id !== id));
//     } catch (error) {
//       console.error('Error deleting availability:', error.response || error.message);
//     }
//   };

//   const deleteAppointments = async (ids) => {
//     try {
//       await axios.delete('http://localhost:5000/api/appointment', { data: { ids } });
//       setAppointments(appointments.filter(a => !ids.includes(a._id)));
//       setSelectedExpired([]);
//     } catch (error) {
//       console.error('Error deleting appointments:', error.response || error.message);
//     }
//   };

//   const toggleSelectExpired = (id) => {
//     setSelectedExpired(prev =>
//       prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
//     );
//   };

//   const selectAllExpired = () => {
//     const expiredIds = appointments.filter(a => a.status === 'expired').map(a => a._id);
//     setSelectedExpired(expiredIds);
//   };

//   const filteredAppointments = appointments.filter(a => {
//     if (tab === 'new') return a.rebookingUsed === false;
//     if (tab === 'rebook') return a.status === true && a.rebookingCode;
//     if (tab === 'personal') return a.status === 'pending' && a.couponCode && !a.rebookingCode;
//     if (tab === 'expired') return a.status === 'expired';
//     return true;
//   });

//   console.log('Filtered Appointments:', filteredAppointments, 'Current Tab:', tab);

//   return (
//     <div className="container">
//       <h1>Doctor Panel</h1>

//       <div className="section">
//         <h2>Set Price</h2>
//         <p>Current Price: ₹{price || 'Not set'}</p>
//         <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" />
//         <button onClick={updatePrice}>Update Price</button>
//       </div>

//       <div className="section">
//         <h2>Booking Message</h2>
//         <p>Current Message: {message || 'Not set'} {isMessageEnabled ? '(Enabled)' : '(Disabled)'}</p>
//         <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter message" />
//         <label>
//           <input type="checkbox" checked={isMessageEnabled} onChange={e => setIsMessageEnabled(e.target.checked)} />
//           Enable
//         </label>
//         <button onClick={updateMessage}>Update</button>
//       </div>

//       <div className="section">
//         <h2>Generate Coupon</h2>
//         <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount %" />
//         <button onClick={generateCoupon}>Generate</button>
//         <h3>Saved Coupons</h3>
//         <ul>
//           {coupons.map(c => (
//             <li key={c.code}>{c.code} ({c.discountPercentage}%) <button onClick={() => deleteCoupon(c.code)}>Delete</button></li>
//           ))}
//         </ul>
//       </div>

//       <div className="section">
//         <h2>Set Availability</h2>
//         <div className="availability-row">
//           <div>
//             <label>From Date</label>
//             <input
//               type="date"
//               value={availability.fromDate}
//               onChange={e => updateAvailability('fromDate', e.target.value)}
//             />
//           </div>
//           <div>
//             <label>To Date</label>
//             <input
//               type="date"
//               value={availability.toDate}
//               onChange={e => updateAvailability('toDate', e.target.value)}
//             />
//           </div>
//           <div>
//             <label>Start Time</label>
//             <input
//               type="time"
//               value={availability.startTime}
//               onChange={e => updateAvailability('startTime', e.target.value)}
//             />
//           </div>
//           <div>
//             <label>End Time</label>
//             <input
//               type="time"
//               value={availability.endTime}
//               onChange={e => updateAvailability('endTime', e.target.value)}
//             />
//           </div>
//           <div>
//             <label>Slot Duration (min)</label>
//             <input
//               type="number"
//               value={availability.slotDuration}
//               onChange={e => updateAvailability('slotDuration', e.target.value)}
//               placeholder="Slot (min)"
//             />
//           </div>
//           <div>
//             <label>Break Duration (min)</label>
//             <input
//               type="number"
//               value={availability.breakDuration}
//               onChange={e => updateAvailability('breakDuration', e.target.value)}
//               placeholder="Break (min)"
//             />
//           </div>
//           <div>
//             <label>Price per Slot</label>
//             <input
//               type="number"
//               value={availability.pricePerSlot}
//               onChange={e => updateAvailability('pricePerSlot', e.target.value)}
//               placeholder="Price"
//             />
//           </div>
//         </div>
//         <button onClick={setAvailabilityHandler}>Set Availability</button>
//         <h3>Saved Availabilities</h3>
//         <ul>
//           {savedAvailabilities.map(a => (
//             <li key={a._id}>
//               {new Date(a.date).toLocaleDateString()} {a.startTime} - {a.endTime} | Slot: {a.slotDuration} min | Break: {a.breakDuration} min | Price: ₹{a.pricePerSlot}
//               <button onClick={() => deleteAvailability(a._id)}>Delete</button>
//             </li>
//           ))}
//         </ul>
//       </div>

//       <div className="section">
//         <h2>Appointments</h2>
//         <div className="tabs">
//           <button onClick={() => setTab('new')} className={tab === 'new' ? 'active' : ''}>New</button>
//           <button onClick={() => setTab('rebook')} className={tab === 'rebook' ? 'active' : ''}>Re-Bookings</button>
//           <button onClick={() => setTab('personal')} className={tab === 'personal' ? 'active' : ''}>Personal</button>
//           <button onClick={() => setTab('expired')} className={tab === 'expired' ? 'active' : ''}>Expired</button>
//         </div>
//         {tab === 'expired' && (
//           <div>
//             <label>
//               <input type="checkbox" checked={selectedExpired.length === filteredAppointments.length} onChange={selectAllExpired} />
//               Select All
//             </label>
//             <button onClick={() => deleteAppointments(selectedExpired)} disabled={!selectedExpired.length}>Delete Selected</button>
//           </div>
//         )}
//         <ul>
//           {filteredAppointments.length > 0 ? (
//             filteredAppointments.map(a => (
//               <li key={a._id} onClick={() => setModal(a)}>
//                 {a.firstName} {a.lastName} - {new Date(a.appointmentDate).toLocaleDateString()} {a.appointmentTime} - ₹{a.price}
//                 {a.rebookingCode && ` | Re-booking Code: ${a.rebookingCode}`}
//                 {tab === 'expired' && (
//                   <input
//                     type="checkbox"
//                     checked={selectedExpired.includes(a._id)}
//                     onChange={() => toggleSelectExpired(a._id)}
//                     onClick={e => e.stopPropagation()}
//                   />
//                 )}
//               </li>
//             ))
//           ) : (
//             <li>No appointments found for this tab.</li>
//           )}
//         </ul>
//       </div>

//       {modal && (
//         <div className="modal">
//           <div className="modal-content">
//             <h3>Appointment Details</h3>
//             <p><strong>First Name:</strong> {modal.firstName}</p>
//             <p><strong>Last Name:</strong> {modal.lastName}</p>
//             <p><strong>Phone:</strong> {modal.phone}</p>
//             <p><strong>Email:</strong> {modal.email}</p>
//             <p><strong>Date:</strong> {new Date(modal.appointmentDate).toLocaleDateString()}</p>
//             <p><strong>Time:</strong> {modal.appointmentTime}</p>
//             <p><strong>Price:</strong> ₹{modal.price}</p>
//             <p><strong>Meeting Link:</strong> <a href={modal.meetingLink} target="_blank" rel="noopener noreferrer">{modal.meetingLink}</a></p>
//             {modal.couponCode && <p><strong>Coupon Code:</strong> {modal.couponCode}</p>}
//             {modal.rebookingCode && (
//               <>
//                 <p><strong>Re-booking Code:</strong> {modal.rebookingCode}</p>
//                 <p><strong>Valid From:</strong> {new Date(modal.rebookingValidFrom).toLocaleString()}</p>
//                 <p><strong>Valid Until:</strong> {new Date(modal.rebookingValidUntil).toLocaleString()}</p>
//               </>
//             )}
//             <button onClick={() => setModal(null)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default DoctorPanel;


// FIXME: set availability change to from date and to date

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './DoctorPanel.css';

// function DoctorPanel() {
//   const [price, setPrice] = useState('');
//   const [message, setMessage] = useState('');
//   const [isMessageEnabled, setIsMessageEnabled] = useState(false);
//   const [discount, setDiscount] = useState('');
//   const [coupons, setCoupons] = useState([]);
//   const [availabilities, setAvailabilities] = useState([{ date: '', startTime: '', endTime: '', slotDuration: '', breakDuration: '', pricePerSlot: '' }]);
//   const [savedAvailabilities, setSavedAvailabilities] = useState([]);
//   const [appointments, setAppointments] = useState([]);
//   const [tab, setTab] = useState('new');
//   const [selectedExpired, setSelectedExpired] = useState([]);
//   const [modal, setModal] = useState(null);

//   useEffect(() => {
//     fetchSettings();
//     fetchCoupons();
//     fetchAvailabilities();
//     fetchAppointments();
//   }, []);

//   const fetchSettings = async () => {
//     const res = await axios.get('http://localhost:5000/api/settings');
//     setPrice(res.data.basePrice || '');
//     setMessage(res.data.bookingMessage || '');
//     setIsMessageEnabled(res.data.isMessageEnabled || false);
//   };

//   const fetchAppointments = async () => {
//     const res = await axios.get('http://localhost:5000/api/appointments');
//     console.log('Appointments fetched:', res.data);
//     setAppointments(res.data);
//   };

//   const fetchCoupons = async () => {
//     const res = await axios.get('http://localhost:5000/api/coupons');
//     setCoupons(res.data);
//   };

//   const fetchAvailabilities = async () => {
//     const res = await axios.get('http://localhost:5000/api/availability');
//     setSavedAvailabilities(res.data);
//   };

//   const updatePrice = async () => {
//     if (!price || isNaN(price) || price <= 0) return alert('Price must be a positive number');
//     await axios.post('http://localhost:5000/api/settings/price', { doctorId: 'doctor1', basePrice: parseInt(price) });
//     alert('Price updated');
//     fetchSettings();
//   };

//   const updateMessage = async () => {
//     if (isMessageEnabled && !message) return alert('Message is required when enabled');
//     await axios.post('http://localhost:5000/api/settings/message', { doctorId: 'doctor1', bookingMessage: message, isMessageEnabled });
//     alert('Message updated');
//     fetchSettings();
//   };

//   const generateCoupon = async () => {
//     if (!discount || isNaN(discount) || discount < 0 || discount > 100) return alert('Discount must be between 0 and 100');
//     const res = await axios.post('http://localhost:5000/api/coupon', { doctorId: 'doctor1', discountPercentage: parseInt(discount) });
//     setCoupons([...coupons, { code: res.data.code, discountPercentage: discount }]);
//     setDiscount('');
//     fetchCoupons();
//   };

//   const deleteCoupon = async (code) => {
//     await axios.delete(`http://localhost:5000/api/coupon/${code}`);
//     setCoupons(coupons.filter(c => c.code !== code));
//     fetchCoupons();
//   };

//   const addAvailability = () => {
//     setAvailabilities([...availabilities, { date: '', startTime: '', endTime: '', slotDuration: '', breakDuration: '', pricePerSlot: '' }]);
//   };

//   const removeAvailability = (index) => {
//     if (availabilities.length === 1) return;
//     setAvailabilities(availabilities.filter((_, i) => i !== index));
//   };

//   const updateAvailability = (index, field, value) => {
//     const newAvailabilities = [...availabilities];
//     if (['slotDuration', 'breakDuration', 'pricePerSlot'].includes(field)) {
//       newAvailabilities[index][field] = value === '' ? '' : parseInt(value);
//     } else {
//       newAvailabilities[index][field] = value;
//     }
//     setAvailabilities(newAvailabilities);
//   };

//   const setAvailabilityHandler = async () => {
//     for (const a of availabilities) {
//       if (!a.date || !a.startTime || !a.endTime || !a.slotDuration || !a.breakDuration || !a.pricePerSlot) {
//         return alert('All availability fields are required');
//       }
//       if (isNaN(a.slotDuration) || a.slotDuration <= 0 || isNaN(a.breakDuration) || a.breakDuration < 0 || isNaN(a.pricePerSlot) || a.pricePerSlot <= 0) {
//         return alert('Invalid numeric values in availability');
//       }
//     }
//     const payload = availabilities.map(a => ({ ...a, doctorId: 'doctor1' }));
//     await axios.post('http://localhost:5000/api/availability', payload);
//     alert('Availability set');
//     fetchAvailabilities();
//   };

//   const deleteAvailability = async (id) => {
//     await axios.delete(`http://localhost:5000/api/availability/${id}`);
//     setSavedAvailabilities(savedAvailabilities.filter(a => a._id !== id));
//   };

//   const deleteAppointments = async (ids) => {
//     await axios.delete('http://localhost:5000/api/appointment', { data: { ids } });
//     setAppointments(appointments.filter(a => !ids.includes(a._id)));
//     setSelectedExpired([]);
//   };

//   const toggleSelectExpired = (id) => {
//     setSelectedExpired(prev => 
//       prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
//     );
//   };

//   const selectAllExpired = () => {
//     const expiredIds = appointments.filter(a => a.status === 'expired').map(a => a._id);
//     setSelectedExpired(expiredIds);
//   };

//   const filteredAppointments = appointments.filter(a => {
//     if (tab === 'new') return a.rebookingUsed === false // && !a.couponCode && !a.rebookingCode; // New bookings: no coupon, no rebooking
//     if (tab === 'rebook') return a.status === true && a.rebookingCode; // Re-bookings: has rebookingCode
//     if (tab === 'personal') return a.status === 'pending' && a.couponCode && !a.rebookingCode; // Personal: has couponCode, no rebooking
//     if (tab === 'expired') return a.status === 'expired'; // Expired: status is expired
//     return true;
//   });

//   console.log('Filtered Appointments:', filteredAppointments, 'Current Tab:', tab);

//   return (
//     <div className="container">
//       <h1>Doctor Panel</h1>

//       <div className="section">
//         <h2>Set Price</h2>
//         <p>Current Price: ₹{price || 'Not set'}</p>
//         <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" />
//         <button onClick={updatePrice}>Update Price</button>
//       </div>

//       <div className="section">
//         <h2>Booking Message</h2>
//         <p>Current Message: {message || 'Not set'} {isMessageEnabled ? '(Enabled)' : '(Disabled)'}</p>
//         <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter message" />
//         <label>
//           <input type="checkbox" checked={isMessageEnabled} onChange={e => setIsMessageEnabled(e.target.checked)} />
//           Enable
//         </label>
//         <button onClick={updateMessage}>Update</button>
//       </div>

//       <div className="section">
//         <h2>Generate Coupon</h2>
//         <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount %" />
//         <button onClick={generateCoupon}>Generate</button>
//         <h3>Saved Coupons</h3>
//         <ul>
//           {coupons.map(c => (
//             <li key={c.code}>{c.code} ({c.discountPercentage}%) <button onClick={() => deleteCoupon(c.code)}>Delete</button></li>
//           ))}
//         </ul>
//       </div>

//       <div className="section">
//         <h2>Set Availability</h2>
//         {availabilities.map((a, index) => (
//           <div key={index} className="availability-row">
//             <input type="date" value={a.date} onChange={e => updateAvailability(index, 'date', e.target.value)} />
//             <input type="time" value={a.startTime} onChange={e => updateAvailability(index, 'startTime', e.target.value)} />
//             <input type="time" value={a.endTime} onChange={e => updateAvailability(index, 'endTime', e.target.value)} />
//             <input type="number" value={a.slotDuration} onChange={e => updateAvailability(index, 'slotDuration', e.target.value)} placeholder="Slot (min)" />
//             <input type="number" value={a.breakDuration} onChange={e => updateAvailability(index, 'breakDuration', e.target.value)} placeholder="Break (min)" />
//             <input type="number" value={a.pricePerSlot} onChange={e => updateAvailability(index, 'pricePerSlot', e.target.value)} placeholder="Price" />
//             {availabilities.length > 1 && <button onClick={() => removeAvailability(index)}>Remove</button>}
//           </div>
//         ))}
//         <button onClick={addAvailability}>Add Another Day</button>
//         <button onClick={setAvailabilityHandler}>Set Availability</button>
//         <h3>Saved Availabilities</h3>
//         <ul>
//           {savedAvailabilities.map(a => (
//             <li key={a._id}>
//               {new Date(a.date).toLocaleDateString()} {a.startTime} - {a.endTime} | Slot: {a.slotDuration} min | Break: {a.breakDuration} min | Price: ₹{a.pricePerSlot}
//               <button onClick={() => deleteAvailability(a._id)}>Delete</button>
//             </li>
//           ))}
//         </ul>
//       </div>

//       <div className="section">
//         <h2>Appointments</h2>
//         <div className="tabs">
//           <button onClick={() => setTab('new')} className={tab === 'new' ? 'active' : ''}>New</button>
//           <button onClick={() => setTab('rebook')} className={tab === 'rebook' ? 'active' : ''}>Re-Bookings</button>
//           <button onClick={() => setTab('personal')} className={tab === 'personal' ? 'active' : ''}>Personal</button>
//           <button onClick={() => setTab('expired')} className={tab === 'expired' ? 'active' : ''}>Expired</button>
//         </div>
//         {tab === 'expired' && (
//           <div>
//             <label>
//               <input type="checkbox" checked={selectedExpired.length === filteredAppointments.length} onChange={selectAllExpired} />
//               Select All
//             </label>
//             <button onClick={() => deleteAppointments(selectedExpired)} disabled={!selectedExpired.length}>Delete Selected</button>
//           </div>
//         )}
//         <ul>
//           {filteredAppointments.length > 0 ? (
//             filteredAppointments.map(a => (
//               <li key={a._id} onClick={() => setModal(a)}>
//                 {a.firstName} {a.lastName} - {new Date(a.appointmentDate).toLocaleDateString()} {a.appointmentTime} - ₹{a.price}
//                 {a.rebookingCode && ` | Re-booking Code: ${a.rebookingCode}`}
//                 {tab === 'expired' && (
//                   <input 
//                     type="checkbox" 
//                     checked={selectedExpired.includes(a._id)} 
//                     onChange={() => toggleSelectExpired(a._id)} 
//                     onClick={e => e.stopPropagation()} 
//                   />
//                 )}
//               </li>
//             ))
//           ) : (
//             <li>No appointments found for this tab.</li>
//           )}
//         </ul>
//       </div>

//       {modal && (
//         <div className="modal">
//           <div className="modal-content">
//             <h3>Appointment Details</h3>
//             <p><strong>First Name:</strong> {modal.firstName}</p>
//             <p><strong>Last Name:</strong> {modal.lastName}</p>
//             <p><strong>Phone:</strong> {modal.phone}</p>
//             <p><strong>Email:</strong> {modal.email}</p>
//             <p><strong>Date:</strong> {new Date(modal.appointmentDate).toLocaleDateString()}</p>
//             <p><strong>Time:</strong> {modal.appointmentTime}</p>
//             <p><strong>Price:</strong> ₹{modal.price}</p>
//             <p><strong>Meeting Link:</strong> <a href={modal.meetingLink} target="_blank" rel="noopener noreferrer">{modal.meetingLink}</a></p>
//             {modal.couponCode && <p><strong>Coupon Code:</strong> {modal.couponCode}</p>}
//             {modal.rebookingCode && (
//               <>
//                 <p><strong>Re-booking Code:</strong> {modal.rebookingCode}</p>
//                 <p><strong>Valid From:</strong> {new Date(modal.rebookingValidFrom).toLocaleString()}</p>
//                 <p><strong>Valid Until:</strong> {new Date(modal.rebookingValidUntil).toLocaleString()}</p>
//               </>
//             )}
//             <button onClick={() => setModal(null)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default DoctorPanel;


// TODO: fix ui for delete for options for each steps

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './DoctorPanel.css';

// function DoctorPanel() {
//   const [price, setPrice] = useState('');
//   const [message, setMessage] = useState('');
//   const [isMessageEnabled, setIsMessageEnabled] = useState(false);
//   const [discount, setDiscount] = useState('');
//   const [coupons, setCoupons] = useState([]);
//   const [availabilities, setAvailabilities] = useState([{ date: '', startTime: '', endTime: '', slotDuration: '', breakDuration: '', pricePerSlot: '' }]);
//   const [appointments, setAppointments] = useState([]);
//   const [tab, setTab] = useState('new');
//   const [selectedExpired, setSelectedExpired] = useState([]);
//   const [modal, setModal] = useState(null);

//   useEffect(() => {
//     fetchAppointments();
//     fetchCoupons();
//   }, []);

//   const fetchAppointments = async () => {
//     const res = await axios.get('http://localhost:5000/api/appointments');
//     setAppointments(res.data);
//   };

//   const fetchCoupons = async () => {
//     const res = await axios.get('http://localhost:5000/api/coupons');
//     setCoupons(res.data);
//   };

//   const updatePrice = async () => {
//     if (!price || isNaN(price) || price <= 0) return alert('Price must be a positive number');
//     await axios.post('http://localhost:5000/api/settings/price', { doctorId: 'doctor1', basePrice: parseInt(price) });
//     alert('Price updated');
//   };

//   const updateMessage = async () => {
//     if (isMessageEnabled && !message) return alert('Message is required when enabled');
//     await axios.post('http://localhost:5000/api/settings/message', { doctorId: 'doctor1', bookingMessage: message, isMessageEnabled });
//     alert('Message updated');
//   };

//   const generateCoupon = async () => {
//     if (!discount || isNaN(discount) || discount < 0 || discount > 100) return alert('Discount must be between 0 and 100');
//     const res = await axios.post('http://localhost:5000/api/coupon', { doctorId: 'doctor1', discountPercentage: parseInt(discount) });
//     setCoupons([...coupons, { code: res.data.code, discountPercentage: discount }]);
//     setDiscount('');
//   };

//   const deleteCoupon = async (code) => {
//     await axios.delete(`http://localhost:5000/api/coupon/${code}`);
//     setCoupons(coupons.filter(c => c.code !== code));
//   };

//   const addAvailability = () => {
//     setAvailabilities([...availabilities, { date: '', startTime: '', endTime: '', slotDuration: '', breakDuration: '', pricePerSlot: '' }]);
//   };

//   const removeAvailability = (index) => {
//     if (availabilities.length === 1) return;
//     setAvailabilities(availabilities.filter((_, i) => i !== index));
//   };

//   const updateAvailability = (index, field, value) => {
//     const newAvailabilities = [...availabilities];
//     if (['slotDuration', 'breakDuration', 'pricePerSlot'].includes(field)) {
//       newAvailabilities[index][field] = value === '' ? '' : parseInt(value);
//     } else {
//       newAvailabilities[index][field] = value;
//     }
//     setAvailabilities(newAvailabilities);
//   };

//   const setAvailabilityHandler = async () => {
//     for (const a of availabilities) {
//       if (!a.date || !a.startTime || !a.endTime || !a.slotDuration || !a.breakDuration || !a.pricePerSlot) {
//         return alert('All availability fields are required');
//       }
//       if (isNaN(a.slotDuration) || a.slotDuration <= 0 || isNaN(a.breakDuration) || a.breakDuration < 0 || isNaN(a.pricePerSlot) || a.pricePerSlot <= 0) {
//         return alert('Invalid numeric values in availability');
//       }
//     }
//     const payload = availabilities.map(a => ({ ...a, doctorId: 'doctor1' })); // Add doctorId to each object
//     console.log('Sending availability data:', payload);
//     try {
//       await axios.post('http://localhost:5000/api/availability', payload);
//       alert('Availability set');
//     } catch (err) {
//       console.error('Error setting availability:', err.response?.data);
//       alert('Failed to set availability: ' + (err.response?.data?.error || 'Unknown error'));
//     }
//   };

//   const deleteAppointments = async (ids) => {
//     await axios.delete('http://localhost:5000/api/appointment', { data: { ids } });
//     setAppointments(appointments.filter(a => !ids.includes(a._id)));
//     setSelectedExpired([]);
//   };

//   const toggleSelectExpired = (id) => {
//     setSelectedExpired(prev => 
//       prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
//     );
//   };

//   const selectAllExpired = () => {
//     const expiredIds = appointments.filter(a => a.status === 'expired').map(a => a._id);
//     setSelectedExpired(expiredIds);
//   };

//   const filteredAppointments = appointments.filter(a => {
//     if (tab === 'new') return a.status === 'pending' && !a.couponType && !a.rebookingCode;
//     if (tab === 'rebook') return a.status === 'pending' && a.rebookingCode;
//     if (tab === 'personal') return a.status === 'pending' && a.couponType === 'personal';
//     if (tab === 'expired') return a.status === 'expired';
//     return true;
//   });

//   return (
//     <div className="container">
//       <h1>Doctor Panel</h1>

//       <div className="section">
//         <h2>Set Price</h2>
//         <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" />
//         <button onClick={updatePrice}>Update Price</button>
//       </div>

//       <div className="section">
//         <h2>Booking Message</h2>
//         <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter message" />
//         <label>
//           <input type="checkbox" checked={isMessageEnabled} onChange={e => setIsMessageEnabled(e.target.checked)} />
//           Enable
//         </label>
//         <button onClick={updateMessage}>Update</button>
//       </div>

//       <div className="section">
//         <h2>Generate Coupon</h2>
//         <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount %" />
//         <button onClick={generateCoupon}>Generate</button>
//         <ul>
//           {coupons.map(c => (
//             <li key={c.code}>{c.code} ({c.discountPercentage}%) <button onClick={() => deleteCoupon(c.code)}>Delete</button></li>
//           ))}
//         </ul>
//       </div>

//       <div className="section">
//         <h2>Set Availability</h2>
//         {availabilities.map((a, index) => (
//           <div key={index} className="availability-row">
//             <input type="date" value={a.date} onChange={e => updateAvailability(index, 'date', e.target.value)} />
//             <input type="time" value={a.startTime} onChange={e => updateAvailability(index, 'startTime', e.target.value)} />
//             <input type="time" value={a.endTime} onChange={e => updateAvailability(index, 'endTime', e.target.value)} />
//             <input type="number" value={a.slotDuration} onChange={e => updateAvailability(index, 'slotDuration', e.target.value)} placeholder="Slot (min)" />
//             <input type="number" value={a.breakDuration} onChange={e => updateAvailability(index, 'breakDuration', e.target.value)} placeholder="Break (min)" />
//             <input type="number" value={a.pricePerSlot} onChange={e => updateAvailability(index, 'pricePerSlot', e.target.value)} placeholder="Price" />
//             {availabilities.length > 1 && <button onClick={() => removeAvailability(index)}>Remove</button>}
//           </div>
//         ))}
//         <button onClick={addAvailability}>Add Another Day</button>
//         <button onClick={setAvailabilityHandler}>Set Availability</button>
//       </div>

//       <div className="section">
//         <h2>Appointments</h2>
//         <div className="tabs">
//           <button onClick={() => setTab('new')} className={tab === 'new' ? 'active' : ''}>New</button>
//           <button onClick={() => setTab('rebook')} className={tab === 'rebook' ? 'active' : ''}>Re-Bookings</button>
//           <button onClick={() => setTab('personal')} className={tab === 'personal' ? 'active' : ''}>Personal</button>
//           <button onClick={() => setTab('expired')} className={tab === 'expired' ? 'active' : ''}>Expired</button>
//         </div>
//         {tab === 'expired' && (
//           <div>
//             <label>
//               <input type="checkbox" checked={selectedExpired.length === filteredAppointments.length} onChange={selectAllExpired} />
//               Select All
//             </label>
//             <button onClick={() => deleteAppointments(selectedExpired)} disabled={!selectedExpired.length}>Delete Selected</button>
//           </div>
//         )}
//         <ul>
//           {filteredAppointments.map(a => (
//             <li key={a._id} onClick={() => setModal(a)}>
//               {a.firstName} {a.lastName} - {new Date(a.appointmentDate).toLocaleDateString()} {a.appointmentTime} - ₹{a.price}
//               {a.rebookingCode && ` | Re-booking Code: ${a.rebookingCode}`}
//               {tab === 'expired' && (
//                 <input type="checkbox" checked={selectedExpired.includes(a._id)} onChange={() => toggleSelectExpired(a._id)} onClick={e => e.stopPropagation()} />
//               )}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {modal && (
//         <div className="modal">
//           <div className="modal-content">
//             <h3>Appointment Details</h3>
//             <p><strong>First Name:</strong> {modal.firstName}</p>
//             <p><strong>Last Name:</strong> {modal.lastName}</p>
//             <p><strong>Phone:</strong> {modal.phone}</p>
//             <p><strong>Email:</strong> {modal.email}</p>
//             <p><strong>Date:</strong> {new Date(modal.appointmentDate).toLocaleDateString()}</p>
//             <p><strong>Time:</strong> {modal.appointmentTime}</p>
//             <p><strong>Price:</strong> ₹{modal.price}</p>
//             <p><strong>Meeting Link:</strong> <a href={modal.meetingLink} target="_blank" rel="noopener noreferrer">{modal.meetingLink}</a></p>
//             {modal.couponCode && <p><strong>Coupon Code:</strong> {modal.couponCode}</p>}
//             {modal.rebookingCode && (
//               <>
//                 <p><strong>Re-booking Code:</strong> {modal.rebookingCode}</p>
//                 <p><strong>Valid From:</strong> {new Date(modal.rebookingValidFrom).toLocaleDateString()}</p>
//                 <p><strong>Valid Until:</strong> {new Date(modal.rebookingValidUntil).toLocaleDateString()}</p>
//               </>
//             )}
//             <button onClick={() => setModal(null)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default DoctorPanel;

// FIXME:

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// function DoctorPanel() {
//   const [price, setPrice] = useState(1000);
//   const [message, setMessage] = useState('');
//   const [isMessageEnabled, setIsMessageEnabled] = useState(false);
//   const [discount, setDiscount] = useState('');
//   const [coupons, setCoupons] = useState([]);
//   const [availability, setAvailability] = useState({ date: '2025-04-06', startTime: '13:00', endTime: '16:00', slotDuration: 30, breakDuration: 15, pricePerSlot: 1000 });
//   const [appointments, setAppointments] = useState([]);
//   const [tab, setTab] = useState('new');

//   useEffect(() => {
//     fetchAppointments();
//     fetchCoupons();
//   }, []);

//   const fetchAppointments = async () => {
//     const res = await axios.get('http://localhost:5000/api/appointments');
//     setAppointments(res.data);
//   };

//   const fetchCoupons = async () => {
//     const res = await axios.get('http://localhost:5000/api/coupons');
//     setCoupons(res.data.filter(c => c.couponType === 'personal'));
//   };

//   const updatePrice = async () => {
//     await axios.post('http://localhost:5000/api/settings/price', { doctorId: 'doctor1', basePrice: price });
//     alert('Price updated');
//   };

//   const updateMessage = async () => {
//     await axios.post('http://localhost:5000/api/settings/message', { doctorId: 'doctor1', bookingMessage: message, isMessageEnabled });
//     alert('Message updated');
//   };

//   const generateCoupon = async () => {
//     const res = await axios.post('http://localhost:5000/api/coupon', { doctorId: 'doctor1', discountPercentage: parseInt(discount) });
//     setCoupons([...coupons, { code: res.data.code, discountPercentage: discount }]);
//     setDiscount('');
//   };

//   const deleteCoupon = async (code) => {
//     await axios.delete(`http://localhost:5000/api/coupon/${code}`);
//     setCoupons(coupons.filter(c => c.code !== code));
//   };

//   const setAvailabilityHandler = async () => {
//     await axios.post('http://localhost:5000/api/availability', { doctorId: 'doctor1', ...availability });
//     alert('Availability set');
//   };

//   const filteredAppointments = appointments.filter(a => {
//     if (tab === 'new') return !a.couponType;
//     if (tab === 'rebook') return a.couponType === 'rebooking';
//     if (tab === 'personal') return a.couponType === 'personal';
//     return true;
//   });

//   return (
//     <div>
//       <h1>Doctor Panel</h1>
      
//       <div>
//         <h2>Set Price</h2>
//         <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
//         <button onClick={updatePrice}>Update Price</button>
//       </div>

//       <div>
//         <h2>Booking Message</h2>
//         <input value={message} onChange={e => setMessage(e.target.value)} />
//         <label>
//           <input type="checkbox" checked={isMessageEnabled} onChange={e => setIsMessageEnabled(e.target.checked)} />
//           Enable
//         </label>
//         <button onClick={updateMessage}>Update</button>
//       </div>

//       <div>
//         <h2>Generate Coupon</h2>
//         <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount %" />
//         <button onClick={generateCoupon}>Generate</button>
//         <ul>
//           {coupons.map(c => (
//             <li key={c.code}>{c.code} ({c.discountPercentage}%) <button onClick={() => deleteCoupon(c.code)}>Delete</button></li>
//           ))}
//         </ul>
//       </div>

//       <div>
//         <h2>Set Availability</h2>
//         <input type="date" value={availability.date} onChange={e => setAvailability({ ...availability, date: e.target.value })} />
//         <input type="time" value={availability.startTime} onChange={e => setAvailability({ ...availability, startTime: e.target.value })} />
//         <input type="time" value={availability.endTime} onChange={e => setAvailability({ ...availability, endTime: e.target.value })} />
//         <input type="number" value={availability.slotDuration} onChange={e => setAvailability({ ...availability, slotDuration: e.target.value })} placeholder="Slot Duration (min)" />
//         <input type="number" value={availability.breakDuration} onChange={e => setAvailability({ ...availability, breakDuration: e.target.value })} placeholder="Break Duration (min)" />
//         <input type="number" value={availability.pricePerSlot} onChange={e => setAvailability({ ...availability, pricePerSlot: e.target.value })} placeholder="Price per Slot" />
//         <button onClick={setAvailabilityHandler}>Set</button>
//       </div>

//       <div>
//         <h2>Appointments</h2>
//         <button onClick={() => setTab('new')}>New</button>
//         <button onClick={() => setTab('rebook')}>Re-Bookings</button>
//         <button onClick={() => setTab('personal')}>Personal</button>
//         <ul>
//           {filteredAppointments.map(a => (
//             <li key={a._id}>{a.firstName} {a.lastName} - {a.appointmentDate} {a.appointmentTime} - ₹{a.price}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }

// export default DoctorPanel;