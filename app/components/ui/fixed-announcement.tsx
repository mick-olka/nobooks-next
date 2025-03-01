type Props = {
  message: string;
};
export const FixedAnnouncement = ({ message }: Props) => {
  return (
    <div className="fixed bottom-5 left-5 bg-[#FFDD00] text-gray-800 px-3 py-2 rounded-md text-sm font-bold shadow-md z-50 opacity-50">
      {message}
    </div>
  );
};
