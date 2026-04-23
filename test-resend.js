fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer re_P8cYsG15_6YjTiVXRQ1ct2sv3WwJTdAQs'
  },
  body: JSON.stringify({
    from: 'onboarding@resend.dev',
    to: 'beehivecarrybee@gmail.com',
    subject: 'hello world',
    html: '<strong>it works!</strong>'
  })
}).then(res => res.json()).then(console.log);
