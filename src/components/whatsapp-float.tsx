import whatsappIcon from "../assets/whatsapp-icon.png.asset.json";

const WHATSAPP_NUMBER = "5515997261852";
const MESSAGE = "Olá! Estou com algumas dúvidas sobre os perfumes, conseguiria me ajudar?";

export function WhatsAppFloat() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-20 right-4 z-40 transition hover:scale-110 sm:bottom-6 sm:right-6"
    >
      <img
        src={whatsappIcon.url}
        alt="WhatsApp"
        className="h-14 w-14 drop-shadow-lg sm:h-16 sm:w-16"
      />
    </a>
  );
}
