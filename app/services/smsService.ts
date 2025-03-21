export const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    const formattedPhone = phoneNumber
      .replace(/\D/g, '')
      .replace(/^0+/, '+63');
   
    const response = await fetch('https://app.philsms.com/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer 1308|QzHqnNuiO7xjeEzknr6f1lBKEkbhDBF08Wsrx90l'
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: 'PhilSMS',
        type: 'plain',
        message,
      })
    });

    const data = await response.json();
    console.log('SMS Response:', data);
    return data;
  } catch (error) {
    console.error('SMS Error:', error);
    throw error;
  }
};
