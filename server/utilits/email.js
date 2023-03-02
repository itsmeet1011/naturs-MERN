import nodemailer from 'nodemailer';

const sendEmail = async (option) => {
  console.log('hi mail');
  // create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  //define email option
  const mailOPtion = {
    from: 'Sumit Das <adminmail@gmail.com>',
    to: option.email,
    subject: option.subject,
    text: option.message,
  };
  console.log('hii 222');

  //   actual mail send
  const res = await transporter.sendMail(mailOPtion);
  console.log(res);
};

export default sendEmail;
