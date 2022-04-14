---
title: js/form
description: Form validation
authors: [mike]
tags: [JavaScript]
hide_table_of_contents: false
---

Define validation rules and corresponding messages with `yup`.
```JavaScript
import * as yup from "yup";
const schema = yup.object().shape({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().required("Password is required"),
    confirmPassword: yup.string().required("Confirm password")
        .test("pwd-match", "Passwords must match", function(value) => {
            return this.parent.password === value;
        })
})
```

Resolve `yup` schema and make it a react hook state with `@hookform/resolvers`.
```JavaScript
import { yupResolver } from '@hookform/resolvers/yup';
export default function Index(props){
    const {
        register, 
        handleSubmit, 
        handleSubmit,
        formState: {errors}
    } = useForm({
        mode: "all",
        resolver: yupResolver(schema)
    })
    return (<>
        ...
    </>)
}
```

Register form component to the form.
```JavaScript
import {TextField} from "@mui/material";
export default function Index(props){
    ...
    const onSubmit = (data) => console.log("form: " + data);
    return (<>
        <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
                label="Email"
                {...register("email")}
                error={errors.email?.message? true : false}
                helperText={errors.email?.message}
            />
            ...
        </form>
    </>)
}
```
