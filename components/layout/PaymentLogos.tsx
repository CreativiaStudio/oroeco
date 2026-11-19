/** Badge SVG vettoriali dei circuiti di pagamento e finanziamento accettati da ORO&CO. */
export function PaymentLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Visa */}
      <span
        title="Visa"
        aria-label="Visa"
        className="inline-flex h-8 w-[52px] items-center justify-center rounded-[3px] border border-white/15 bg-white px-2 shadow-sm"
      >
        <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden="true">
          <text
            x="24"
            y="13"
            textAnchor="middle"
            fill="#1A1F71"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="14.5"
            letterSpacing="-0.5"
          >
            VISA
          </text>
        </svg>
      </span>

      {/* Mastercard */}
      <span
        title="Mastercard"
        aria-label="Mastercard"
        className="inline-flex h-8 w-[52px] items-center justify-center rounded-[3px] border border-white/15 bg-white px-2 shadow-sm"
      >
        <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-hidden="true">
          <circle cx="14" cy="12" r="8.5" fill="#EB001B" />
          <circle cx="24" cy="12" r="8.5" fill="#F79E1B" />
          <path
            d="M19 5.3A8.48 8.48 0 0 0 15.8 12c0 2.7 1.26 5.1 3.2 6.7A8.48 8.48 0 0 0 22.2 12c0-2.7-1.26-5.1-3.2-6.7Z"
            fill="#FF5F00"
          />
        </svg>
      </span>

      {/* American Express */}
      <span
        title="American Express"
        aria-label="American Express"
        className="inline-flex h-8 w-[52px] items-center justify-center rounded-[3px] border border-[#2E77BC] bg-[#2E77BC] px-1.5 shadow-sm"
      >
        <svg viewBox="0 0 48 18" className="h-3.5 w-auto" aria-hidden="true">
          <text
            x="24"
            y="13"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="11.5"
            letterSpacing="0.4"
          >
            AMEX
          </text>
        </svg>
      </span>

      {/* PayPal */}
      <span
        title="PayPal"
        aria-label="PayPal"
        className="inline-flex h-8 items-center justify-center rounded-[3px] border border-white/15 bg-white px-2.5 shadow-sm"
      >
        <svg viewBox="0 0 64 18" className="h-3.5 w-auto" aria-hidden="true">
          <text
            x="2"
            y="14"
            fill="#003087"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="14"
          >
            Pay
          </text>
          <text
            x="30"
            y="14"
            fill="#0079C1"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="14"
          >
            Pal
          </text>
        </svg>
      </span>

      {/* Apple Pay */}
      <span
        title="Apple Pay"
        aria-label="Apple Pay"
        className="inline-flex h-8 items-center justify-center gap-1 rounded-[3px] border border-white/15 bg-white px-2.5 shadow-sm"
      >
        <svg viewBox="0 0 14 17" className="h-3.5 w-auto fill-[#000000]" aria-hidden="true">
          <path d="M11.6 9.1c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.4-2.7-1.5-1.1-.1-2.2.7-2.8.7-.6 0-1.5-.7-2.4-.7-1.3 0-2.4.7-3.1 1.9-1.3 2.3-.3 5.7.9 7.5.6.9 1.4 1.9 2.3 1.9.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2.1-.1 0-1.8-.7-1.8-3ZM9.7 3.4c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.2 1.1-.5.5-.9 1.4-.8 2.3.9.1 1.7-.4 2.2-1Z" />
        </svg>
        <span className="font-sans text-[12px] font-semibold tracking-tight text-black">
          Pay
        </span>
      </span>

      {/* Klarna */}
      <span
        title="Klarna"
        aria-label="Klarna"
        className="inline-flex h-8 items-center justify-center rounded-[3px] border border-[#FFB3C7] bg-[#FFB3C7] px-2.5 shadow-sm"
      >
        <span className="font-sans text-[11.5px] font-extrabold tracking-tight text-[#0A0B09]">
          Klarna.
        </span>
      </span>

      {/* Scalapay */}
      <span
        title="Scalapay"
        aria-label="Scalapay"
        className="inline-flex h-8 items-center justify-center rounded-[3px] border border-[#32D4C0]/40 bg-[#0B2239] px-2.5 shadow-sm"
      >
        <span className="font-sans text-[11px] font-bold tracking-tight text-[#66E3D2]">
          scala<span className="text-white">pay</span>
        </span>
      </span>

      {/* Revolut */}
      <span
        title="Revolut"
        aria-label="Revolut"
        className="inline-flex h-8 items-center justify-center rounded-[3px] border border-white/15 bg-white px-2.5 shadow-sm"
      >
        <span className="font-sans text-[12px] font-extrabold tracking-tight text-[#191C1F]">
          Revolut
        </span>
      </span>

      {/* Compass */}
      <span
        title="Compass"
        aria-label="Compass"
        className="inline-flex h-8 items-center justify-center gap-1 rounded-[3px] border border-[#0057A3] bg-[#0057A3] px-2.5 shadow-sm"
      >
        <svg viewBox="0 0 14 14" className="h-3 w-3 shrink-0" aria-hidden="true">
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="#FFD100" strokeWidth="1.8" />
          <circle cx="7" cy="7" r="2" fill="#FFFFFF" />
        </svg>
        <span className="font-sans text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-white">
          Compass
        </span>
      </span>
    </div>
  );
}
