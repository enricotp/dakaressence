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
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition hover:scale-105 hover:bg-[#20ba57] sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.28c-.28-.14-1.65-.81-1.9-.9-.26-.1-.44-.14-.63.14-.19.28-.72.9-.88 1.09-.16.19-.32.21-.6.07-.28-.14-1.17-.43-2.23-1.38-.82-.73-1.38-1.63-1.54-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.51-.86-2.07-.22-.54-.45-.47-.63-.48h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.33 0 1.38 1 2.71 1.14 2.9.14.19 1.97 3 4.77 4.21.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.65-.67 1.89-1.32.23-.65.23-1.2.16-1.32-.06-.13-.25-.2-.53-.34zM16.05 5.33c-5.89 0-10.66 4.77-10.66 10.66 0 1.88.49 3.71 1.42 5.33L5 27l5.83-1.53a10.62 10.62 0 0 0 5.22 1.36h.01c5.88 0 10.66-4.77 10.66-10.66S21.94 5.33 16.05 5.33z" />
      </svg>
    </a>
  );
}
