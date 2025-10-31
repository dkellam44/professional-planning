type Props = {
  h1: string;
  body: React.ReactNode;
  icon?: React.ReactNode;
};

export default function TextSlide({ h1, body, icon }: Props) {
  return (
    <div>
      <h2 className="font-display text-3xl md:text-4xl text-plum mb-6 flex items-center gap-3">
        {icon ? <span className="text-2xl">{icon}</span> : null}
        {h1}
      </h2>
      <div className="prose prose-neutral max-w-none">{body}</div>
    </div>
  );
}
