    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            navigate("/dashboard");
        } catch (err) {
            let msg = "Registration failed. Please try again.";
            
            if (err.response?.status === 409) {
                msg = "User already exists. Please login instead.";
            } else {
                msg = err.response?.data?.errors?.[0]?.msg 
                    || err.response?.data?.message 
                    || msg;
            }
            
            setError(msg);
        } finally {
            setLoading(false);
        }
    };