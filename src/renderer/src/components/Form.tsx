import { usePrescriptionStore } from "@renderer/store/prescriptionStore";
import { Link } from "react-router-dom";

const Form = () => {
    const setPatientInfo = usePrescriptionStore((state) => state.setPatientInfo);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());

        setPatientInfo({
            name: data.name as string,
            age: parseInt(data.age as string, 10),
        });
    };

    return (
        <div className="formContainer">
            <Link to="/" className="backButton">
                Back
            </Link>
            <h1>Enter Patient Information</h1>
            <form className="form" method="POST" onSubmit={handleSubmit}>
                <div className="nameDiv">
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" name="name" />
                </div>
                <div className="ageDiv">
                    <label htmlFor="age">Age</label>
                    <input type="number" id="age" name="age" />
                </div>
                <button className="submit" type="submit">
                    Submit
                </button>
            </form>
        </div>
    );
};

export default Form;