type LetterHoverTextProps = {
  text: string;
  className?: string;
};

const LetterHoverText = ({ text, className = "" }: LetterHoverTextProps) => (
  <span
    className={`letter-hover-text${className ? ` ${className}` : ""}`}
    aria-label={text}
  >
    {Array.from(text).map((character, index) => (
      <span
        className={
          character === " " ? "letter-hover-space" : "letter-hover-character"
        }
        aria-hidden="true"
        key={`${character}-${index}`}
      >
        {character === " " ? "\u00a0" : character}
      </span>
    ))}
  </span>
);

export default LetterHoverText;
