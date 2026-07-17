import { NextResponse } from "next/server";
import Turnstile from "cf-turnstile";
import nodemailer from "nodemailer";

const turnstile = Turnstile(process.env.TURNSTILE_SECRET_KEY);

export async function POST(req) {
  const { formData, token } = await req.json();

  // Check Turnstile token
   if (!token) {
    return NextResponse.json(
      { message: "No Turnstile token provided" },
      { status: 400 },
    );
  }

  const verification = await turnstile(token);
  if (!verification.success) {
    return NextResponse.json(
      { message: "Human verification failed!" },
      { status: 400 },
    );
  } 

  // Validate form data
  const { name, email, subject, message } = formData || {};

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { message: "All form fields are required!" },
      { status: 400 },
    );
  }

  try {
    // 1. Submit to Google Form (Sheet)
    const formUrl = process.env.GOOGLE_SUBMIT_FORM_URL;
    const params = new URLSearchParams({
      [process.env.GOOGLE_ENTRY_NAME]: name,
      [process.env.GOOGLE_ENTRY_EMAIL]: email,
      [process.env.GOOGLE_ENTRY_SUBJECT]: subject,
      [process.env.GOOGLE_ENTRY_MESSAGE]: message,
    });

    await fetch(`${formUrl}?${params.toString()}`, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // 2. Setup Nodemailer for sending emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // Email to yourself (Notification)
    const myEmail = "saimonss5432@gmail.com";
    const mySubject = "New Form Submission: " + subject;
    const myBody = `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nText: ${message}`;


    // Send email
    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: myEmail,
        subject: mySubject,
        text: myBody,
      }),
   
    ]);

    return NextResponse.json({
      message: "Form submitted and emails sent successfully!",
    });
  } catch (err) {
    console.error("Email/Form Error:", err);
    return NextResponse.json(
      { message: "Failed to process request. Please try again." },
      { status: 500 },
    );
  }
}
