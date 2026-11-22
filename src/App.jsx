function App() {
  async function sendNotification() {
    if (!("Notification" in window)) {
      alert("Browser doesnot support notification");
      return;
    }
    let permission = Notification.permission;

    if(permission === 'default'){
      permission =  await Notification.requestPermission();
    }

    if (permission === "granted") {
      new Notification("Hello From React", {
        body: "This is test notification",
      });
    }else{
      alert("Permission is denied")
    }
  }
  return (
    <>
      <h1>Press the button to get Notification</h1>
      <button onClick={sendNotification}>CLick me</button>
    </>
  );
}

export default App;
