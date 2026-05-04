type Props = {
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
};

export default function Mascot({ className, style, alt = "" }: Props) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/mascot.svg" alt={alt} className={className} style={style} />;
}
