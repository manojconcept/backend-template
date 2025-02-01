    import nodemailer from "nodemailer";

    const { AUTH_EMAIL_USERNAME, AUTH_EMAIL_PASSWORD, EMAIL_PORT, EMAIL_HOST } = process.env;

    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT),
        secure: EMAIL_PORT === '465', 
        auth: {
            user: AUTH_EMAIL_USERNAME,
            pass: AUTH_EMAIL_PASSWORD,
        },
    });

    async function sendMail(mailOptions) {
        try {
            const info = await transporter.sendMail({
                from: AUTH_EMAIL_USERNAME, 
                to: mailOptions.to, 
                subject: mailOptions.subject, 
                text: mailOptions.text, 
                html: mailOptions.html || "", 
            });
            console.log("Message sent: %s", info.messageId);
            return info;

        }catch(e){
            console.error("Failed to send email:", error);
            throw error;
        }
    
    }

    export default sendMail;