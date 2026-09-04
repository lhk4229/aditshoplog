<?php

class AdminerDefaultPgsql
{
	function loginFormField($name, $heading, $value)
	{
		if ($name !== 'driver') {
			return null;
		}

		$value = str_replace(' selected', '', $value);
		$value = str_replace('value="pgsql"', 'value="pgsql" selected', $value);
		return $heading . $value;
	}
}

return new AdminerDefaultPgsql();
