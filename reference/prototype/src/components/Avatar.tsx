interface AvatarProps {
  person: 'charlie' | 'sam';
  size?: 'small' | 'medium';
}

export function Avatar({ person, size = 'medium' }: AvatarProps) {
  const name = person === 'charlie' ? 'Charlie' : 'Sam';
  return <span className={`avatar avatar--${person} avatar--${size}`} aria-hidden="true">{name[0]}</span>;
}
