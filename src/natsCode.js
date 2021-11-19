//   const addQuestion = useCallback(
//     (error, message) => {
//       console.log("addQuestion");
//       key.current++;
//       const { subject, reply } = message;
//       const questionData = jc.decode(message.data);
//       const { name, answer } = questionData;
//       if (questionData) {
//         const question = {
//           subject,
//           reply,
//           question: name,
//           answer: answer,
//           key: key.current,
//           time: new Date().toUTCString(),
//         };
//         setQuestions((draft) => {
//           draft.unshift(question);
//         });
//       } else {
//         throw new Error("Invalid Question Data", message);
//       }
//     },
//     [key, setQuestions]
//   );

//   useEffect(() => {
//     if (!natsConnection) {
//       return;
//     }

//     const createStudent = async () => {
//       try {
//         const sub = natsConnection.subscribe("meetID.questions", {
//           callback: addQuestion,
//         });

//         subscriptions.current.push(sub);
//         console.log(`listening for ${sub.getSubject()} requests...`);
//       } catch (error) {
//         console.error(error);
//       }
//     };
