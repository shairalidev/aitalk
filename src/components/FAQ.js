import React from 'react';
import './FAQ.css';

function FAQ() {
  const faqItems = [
    {
      question: "¿Qué es Jesús, Guíame?",
      answer: "Jesús, Guíame es una aplicación de chat que simula una conversación con Jesús, ofreciendo guía y consuelo basados en las enseñanzas bíblicas."
    },
    {
      question: "¿Las respuestas son realmente de Jesús?",
      answer: "No, las respuestas son generadas por inteligencia artificial basada en las enseñanzas atribuidas a Jesús en la Biblia."
    },
    {
      question: "¿Puedo confiar en los consejos dados?",
      answer: "Aunque los consejos se basan en enseñanzas bíblicas, esta app no sustituye la guía espiritual profesional o el consejo médico."
    },
    {
      question: "¿Mis conversaciones son privadas?",
      answer: "Sí, tus conversaciones son privadas y no se comparten. Sin embargo, se almacenan localmente en tu dispositivo."
    }
  ];

  return (
    <div className="faq-container">
      <h2>Preguntas Frecuentes</h2>
      {faqItems.map((item, index) => (
        <div key={index} className="faq-item">
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </div>
      ))}
    </div>
  );
}

export default FAQ;