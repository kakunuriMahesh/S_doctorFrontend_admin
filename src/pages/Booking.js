import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Booking.css';

function Booking() {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', appointmentDate: '', appointmentTime: '', couponCode: '' });
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (form.appointmentDate) {
      axios.get(`http://localhost:5000/api/slots/${form.appointmentDate}`)
        .then(res => setSlots(res.data));
    }
  }, [form.appointmentDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = { firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email, appointmentDate: form.appointmentDate, appointmentTime: form.appointmentTime };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) return setMessage(`${key} is required`);
    }
    try {
      const res = await axios.post('http://localhost:5000/api/appointment', form);
      setMessage(`Appointment booked! Meeting Link: ${res.data.appointment.meetingLink}${res.data.appointment.rebookingCode ? ` | Re-booking Code: ${res.data.appointment.rebookingCode}` : ''}`);
      setForm({ firstName: '', lastName: '', phone: '', email: '', appointmentDate: '', appointmentTime: '', couponCode: '' });
      setSelectedSlot(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error booking appointment');
    }
  };

  return (
    <div className="container">
      <h1>Book Appointment</h1>
      <form onSubmit={handleSubmit} className="form">
        <input placeholder="First Name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Last Name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input 
          type="date" 
          value={form.appointmentDate} 
          onChange={e => setForm({ ...form, appointmentDate: e.target.value, appointmentTime: '' })} 
          min={new Date().toISOString().split('T')[0]} // Prevent past dates
        />
        <select 
          value={form.appointmentTime} 
          onChange={e => {
            const slot = slots.find(s => s.time === e.target.value);
            setForm({ ...form, appointmentTime: e.target.value });
            setSelectedSlot(slot);
          }}
        >
          <option value="">Select Time</option>
          {slots.map(slot => (
            <option key={slot.time} value={slot.time}>
              {slot.time} (₹{slot.price})
            </option>
          ))}
        </select>
        <input 
          placeholder="Coupon Code" 
          value={form.couponCode} 
          onChange={e => setForm({ ...form, couponCode: e.target.value })} 
        />
        {selectedSlot && (
          <p>Duration: {selectedSlot.duration} min | Price: ₹{selectedSlot.price} {form.couponCode ? '(before discount)' : ''}</p>
        )}
        <button type="submit">Book</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Booking;

// TODO: fixible the bookind dates 

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './Booking.css';

// function Booking() {
//   const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', appointmentDate: '', appointmentTime: '', couponCode: '' });
//   const [slots, setSlots] = useState([]);
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     if (form.appointmentDate) {
//       axios.get(`http://localhost:5000/api/slots/${form.appointmentDate}`)
//         .then(res => setSlots(res.data));
//     }
//   }, [form.appointmentDate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const requiredFields = { firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email, appointmentDate: form.appointmentDate, appointmentTime: form.appointmentTime };
//     for (const [key, value] of Object.entries(requiredFields)) {
//       if (!value) return setMessage(`${key} is required`);
//     }
//     try {
//       const res = await axios.post('http://localhost:5000/api/appointment', form);
//       setMessage(`Appointment booked! Meeting Link: ${res.data.appointment.meetingLink}${res.data.appointment.rebookingCode ? ` | Re-booking Code: ${res.data.appointment.rebookingCode}` : ''}`);
//     } catch (err) {
//       setMessage(err.response.data.error || 'Error booking appointment');
//     }
//   };

//   return (
//     <div className="container">
//       <h1>Book Appointment</h1>
//       <form onSubmit={handleSubmit} className="form">
//         <input placeholder="First Name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
//         <input placeholder="Last Name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
//         <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
//         <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
//         <input type="date" value={form.appointmentDate} onChange={e => setForm({ ...form, appointmentDate: e.target.value })} />
//         <select value={form.appointmentTime} onChange={e => setForm({ ...form, appointmentTime: e.target.value })}>
//           <option value="">Select Time</option>
//           {slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
//         </select>
//         <input placeholder="Coupon Code" value={form.couponCode} onChange={e => setForm({ ...form, couponCode: e.target.value })} />
//         <button type="submit">Book</button>
//       </form>
//       {message && <p className="message">{message}</p>}
//     </div>
//   );
// }

// export default Booking;
