    import nodemailer from "nodemailer";

    const { AUTH_EMAIL_USERNAME, AUTH_EMAIL_PASSWORD, EMAIL_PORT, EMAIL_HOST } = process.env;

    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT),
        secure: EMAIL_PORT === '465', // true for port 465, false for other ports
        auth: {
            user: AUTH_EMAIL_USERNAME,
            pass: AUTH_EMAIL_PASSWORD,
        },
    });

    // async..await is not allowed in global scope, must use a wrapper
    async function sendMail(mailOptions) {
        try {
            // send mail with defined transport object
            const info = await transporter.sendMail({
                from: AUTH_EMAIL_USERNAME, // sender address
                to: mailOptions.to, // list of receivers
                subject: mailOptions.subject, // Subject line
                text: mailOptions.text, // plain text body
                html: mailOptions.html || "", // html body
            });

            console.log("Message sent: %s", info.messageId);
            // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
            return info;

        }catch(e){
            console.error("Failed to send email:", error);
            throw error;
        }
    
    }

    export default sendMail;