## Use environment variables to overwrite yaml config object
```go

const PREFIX = "MYVAR_"

func patchWithEnv[T any](config T) (newConfig T, err error) {
	envPatch := make(map[string]interface{})
	for _, v := range os.Environ() {
		if strings.HasPrefix(v, PREFIX) {
			k := strings.Split(v, "=")[0]
			f(envPatch, k, strings.ToLower(strings.Replace(k, PREFIX, "", 1)))
		}
	}

	original, err := convert[map[string]interface{}](Conf)
	if err != nil {
		return
	}
	if err = patch(original, envPatch); err != nil {
		return
	}
	newConfig, err = convert[T](original)
	return
}

// using yaml marshaller to convert an object to map[string]interface{} or reverse
func convert[T any](o any) (result T, err error) {
	raw, err := yaml.Marshal(o)
	if err != nil {
		return
	}
	resultPtr := new(T)
	if err = yaml.Unmarshal(raw, resultPtr); err != nil {
		return
	}
	result = *resultPtr
	return result, nil
}

// update the original map using patch
func patch(o map[string]interface{}, p map[string]interface{}) error {
	for k := range p {
		if _, ok := o[k]; ok { // if o has the same key
			if _, ok := o[k].(map[string]interface{}); ok {
				if _, ok := p[k].(map[string]interface{}); !ok {
					return fmt.Errorf("%s of %s is not a map", k, p)
				}
				// o[k] and p[k] are both map
				return patch(o[k].(map[string]interface{}), p[k].(map[string]interface{}))
			} else { // both are values
				o[k] = p[k]
			}
		} else { // o does not have this key
			o[k] = p[k]
		}
	}
	return nil
}

// recursively turn a list of environment variables to a map
// for example, TEST_LOG_LEVEL=INFO will be placed at {test: {log: {level: "INFO"}}}
func f(curr map[string]interface{}, originalKey string, key string) {
	i := strings.Index(key, "_")
	if i == -1 {
		val := os.Getenv(originalKey)
		if intVal, err := strconv.Atoi(val); err == nil {
			curr[key] = intVal
		} else if boolVal, err := strconv.ParseBool(val); err == nil {
			curr[key] = boolVal
		} else {
			curr[key] = val
		}
	} else {
		thisKey := key[:i]
		curr[thisKey] = make(map[string]interface{})
		f(curr[thisKey].(map[string]interface{}), originalKey, key[i+1:])
	}
}

```
