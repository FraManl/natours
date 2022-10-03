const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // create a transporter
  const transporter = nodemailer.createTransport({
    // activate in gmail "less secure app" option
    // but bad ID to use gmail in a production app...
    // use anotherservice instead...
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // define the email options
  const mailOptions = {
    from: 'mynameis@francois.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
