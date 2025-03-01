type Props = {
  message: string;
};
export const FixedAnnouncement = ({ message }: Props) => {
  return (
    <div className="fixed bottom-5 right-5 bg-yellow-300 text-gray-800 px-3 py-2 rounded-md text-sm font-bold shadow-md z-50 opacity-50">
      {message}
    </div>
  );
};
