interface ArtworkImageProps {
    imageUrl: string;
    name: string;
  }
  
  export function ArtworkImage({ imageUrl, name }: ArtworkImageProps) {
    return (
      <div className="w-full h-[320px] bg-black relative">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }